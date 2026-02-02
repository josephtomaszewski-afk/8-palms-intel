const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.toLowerCase()) });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ firstName, lastName, email, password });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '7d' });
    res.status(201).json({ user: { id: user.id, firstName, lastName, email }, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.toLowerCase()) });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
