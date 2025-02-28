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

// Get a specific todo
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(parseResponse(todo));
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Error fetching todo' });
  }
});

// Create a new todo
router.post('/', todoValidators.create, handleValidationErrors, async (req, res) => {
  try {
    const todo = new Todo(parseRequest(req.body));
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Error creating todo' });
  }
});

// Update a todo
router.put('/:id', todoValidators.update, handleValidationErrors, async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: parseRequest(req.body) },
      { new: true, runValidators: true }
    );
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Error updating todo' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Error deleting todo' });
  }
});

module.exports = router;