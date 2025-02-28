const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/todos';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Received shutdown signal');
  
  // Close HTTP server
  if (app.server) {
    console.log('Closing HTTP server');
    await new Promise(resolve => app.server.close(resolve));
    console.log('HTTP server closed');
  }

  // Close MongoDB connection
  if (mongoose.connection.readyState === 1) {
    console.log('Closing MongoDB connection');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }

  console.log('Graceful shutdown completed');
  process.exit(0);
}