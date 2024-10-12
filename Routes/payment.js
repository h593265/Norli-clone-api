const sql = require('../db');
const express = require("express");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
require('dotenv').config();
const router = express.Router();


router.get("/purchases", async (req, res) => {
  const { userid } = req.query; 

  if (!userid) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const getpurchases = await sql`
      SELECT * FROM purchases WHERE user_id = ${userid};
    `;

    res.status(200).json({ purchases: getpurchases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/", async (req, res) => {
  const { products, userid} = req.body;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: 'nok',
      product_data: {
        name: product.title,
        images: [`${domain}/${product.image}.jpg`], 
      },
      unit_amount: Math.round(product.price * 100),
    },
    quantity: product.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    for (const product of products) {
      const insertPurchaseQuery = await sql`
    INSERT INTO purchases (user_id, product_title, product_price, quantity, purchase_date)
    VALUES (${userid || null}, ${product.title}, ${product.price}, ${products.length}, NOW()) RETURNING id;
  `;
    }
    

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal server error" });
  }



  
});

module.exports = router;
