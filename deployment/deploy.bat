@echo off
setlocal enabledelayedexpansion

set WORKDIR=%cd%
set LOG_FILE=%WORKDIR%\deployment.log

:log
set "timestamp=%date% %time%"
echo [%timestamp%] %~1 >> %LOG_FILE%
echo [%timestamp%] %~1
goto :eof

:verify_health
set port=%~1
set retries=30
set wait_time=2

call :log "Verifying health of environment on port %port%"

for /L %%i in (1,1,%retries%) do (
    curl -s http://localhost:%port%/health | findstr /C:"healthy" >nul
    if !errorlevel! equ 0 (
        call :log "Health check passed after %%i attempts"
        exit /b 0
    )
    call :log "Health check attempt %%i/%retries% failed, waiting %wait_time%s..."
    timeout /t %wait_time% /nobreak >nul
)

call :log "ERROR: Health check failed after %retries% attempts"
exit /b 1

if not exist %WORKDIR%\.active_env (
    call :log "Initializing active environment as blue"
    echo blue > %WORKDIR%\.active_env
)

set /p CURRENT_ENV=<%WORKDIR%\.active_env
call :log "Current active environment: %CURRENT_ENV%"

if "%CURRENT_ENV%"=="blue" (
    set TARGET_ENV=green
    set TARGET_PORT=8082
    set CURRENT_PORT=8081
) else (
    set TARGET_ENV=blue
    set TARGET_PORT=8081
    set CURRENT_PORT=8082
)

call :log "Starting deployment to %TARGET_ENV% environment"

cd /d %WORKDIR%\mongodb
call :log "Starting mongodb"
docker-compose up -d

cd /d %WORKDIR%\proxy
call :log "Starting proxy"
docker-compose up -d

cd /d %WORKDIR%\%TARGET_ENV%
call :log "Building and starting %TARGET_ENV% environment"
docker-compose up -d --build

call :verify_health %TARGET_PORT%
if !errorlevel! neq 0 (
    call :log "ERROR: New environment failed health checks. Rolling back..."
    docker-compose down
    exit /b 1
)

call :log "Updating proxy configuration to point to %TARGET_ENV% environment"
powershell -Command "(Get-Content %WORKDIR%\proxy\nginx.conf) -replace 'server nginx:%CURRENT_PORT%;', 'server nginx:%TARGET_PORT%;' | Set-Content %WORKDIR%\proxy\nginx.conf"

call :log "Reloading proxy configuration"
docker exec proxy nginx -s reload
if !errorlevel! equ 0 (
    call :log "Proxy reload successful"
    echo %TARGET_ENV% > %WORKDIR%\.active_env
    call :log "Successfully switched to %TARGET_ENV% environment"

    call :verify_health 8080
    if !errorlevel! equ 0 (
        call :log "Proxy health check passed. Deployment successful!"
    ) else (
        call :log "WARNING: Proxy health check failed after switch. Please investigate."
    )
) else (
    call :log "ERROR: Failed to reload proxy. Rolling back configuration..."
    powershell -Command "(Get-Content %WORKDIR%\proxy\nginx.conf) -replace 'server localhost:%TARGET_PORT%;', 'server localhost:%CURRENT_PORT%;' | Set-Content %WORKDIR%\proxy\nginx.conf"
    docker exec proxy nginx -s reload
    docker-compose down
    exit /b 1
)

call :log "Deployment completed. Old environment (%CURRENT_ENV%) kept running for safety"
call :log "To remove old environment, run: cd /d %WORKDIR%\%CURRENT_ENV% && docker-compose down"
