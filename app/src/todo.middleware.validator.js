const { body, param, validationResult } = require('express-validator');

// Validation middleware for todo operations
exports.todoValidators = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 100 })
      .withMessage('Title cannot be more than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot be more than 500 characters'),
    body('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean value'),
  ],
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid todo ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title cannot be more than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot be more than 500 characters'),
    body('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean value'),
  ]
};

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};