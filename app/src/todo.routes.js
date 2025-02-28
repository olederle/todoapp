const express = require('express');
const router = express.Router();
const Todo = require('./todo.models');
const { todoValidators, handleValidationErrors } = require('./todo.middleware.validator');
const { parseRequest, parseResponse } = require('./todo.mapper');

// Get all todos
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos.map(parseResponse));
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

module.exports = router;