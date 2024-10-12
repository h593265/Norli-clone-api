const sql = require('../db');
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();


router.use(cookieParser()); 

router.use(express.json());




const isAuthenticated = (req, res, next) => {

    const token = req.cookies.token;
    console.log('Token:', token); 
    if (!token) {
      return res.status(403).json({ message: 'Not authenticated' });
    }
  
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user; 
      next();
    } catch (error) {
      res.status(403).json({ message: 'Invalid token' });
    }
};






// Get user cart

router.get('/cart/:userId', isAuthenticated,async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const cartItems = await sql`
      SELECT p.*, c.quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${userId};
    `;
    res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.post('/cart', isAuthenticated, async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || quantity <= 0) {
    return res.status(400).json({ error: 'User ID, Product ID, and quantity are required' });
  }

  try {
    const result = await sql`
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES (${userId}, ${productId}, ${quantity})
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET quantity = EXCLUDED.quantity
      RETURNING id;
    `;
    res.status(201).json({ id: result[0].id });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.delete('/cart', isAuthenticated, async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and Product ID are required' });
  }

  try {
    await sql`
      DELETE FROM cart
      WHERE user_id = ${userId} AND product_id = ${productId};
    `;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.get('/favorites/:userId', isAuthenticated, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const favorites = await sql`
      SELECT p.*
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ${userId};
    `;
    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/favorites', isAuthenticated, async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and Product ID are required' });
  }

  try {
    const result = await sql`
      INSERT INTO favorites (user_id, product_id)
      VALUES (${userId}, ${productId})
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id;
    `;
    if (result.length > 0) {
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ error: 'Favorite already exists' });
    }
  } catch (error) {
    console.error('Error adding favorite:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.delete('/favorites', isAuthenticated, async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and Product ID are required' });
  }

  try {
    await sql`
      DELETE FROM favorites
      WHERE user_id = ${userId} AND product_id = ${productId};
    `;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
