const sql = require('../db');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;


router.post('/', async (req, res) => {
  const { username, password } = req.body;

  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${username};
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, saltRounds);

   
    const result = await sql`
      INSERT INTO users (email, password)
      VALUES (${username}, ${hashedPassword})
      RETURNING id, email;
    `;

    
    const newUser = result[0];
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (error) {
    console.error('Error during user registration:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
