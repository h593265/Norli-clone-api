const sql = require('../db');
const express = require("express");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
require('dotenv').config();
const router = express.Router();


const domain = process.env.FRONTEND_URL; 

router.post("/", async (req, res) => {
  const { products, userid } = req.body;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: 'nok',
      product_data: {
        name: product.title,
       
        images: [`${domain}/${product.image}`], 
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
      success_url: `${domain}/success`,
      cancel_url: `${domain}/cancel`,
    });

    for (const product of products) {
      await sql`
        INSERT INTO purchases (user_id, product_title, product_price, quantity, purchase_date)
        VALUES (${userid || null}, ${product.title}, ${product.price}, ${product.quantity}, NOW())
        RETURNING id;
      `;
    }

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
