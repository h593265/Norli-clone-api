const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sql = require('../db'); 
const router = express.Router();
require('dotenv').config();

router.use(express.json());


router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const users = await sql`
      SELECT id, email, password FROM users WHERE email = ${email};
    `;

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

   
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error during user login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/protected', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(403).json({ message: 'Not authenticated' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Protected data', user });
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
