require('dotenv').config();

const express = require("express");
const cors = require("cors");
const paymentRoute = require("./Routes/payment");
const loginRoute = require("./Routes/login");
const userRoute = require("./Routes/user")
const productsRoute = require("./Routes/product")
const registerRoute = require("./Routes/register")
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Connected' : '✗ Missing');
console.log('STRIPE_SECRET:', process.env.STRIPE_SECRET ? '✓ Configured' : '✗ Missing');

app.use(cookieParser()); 

app.use(express.json());

const corsOptions ={
  origin: 'https://norli-clone.vercel.app',
  credentials:true,            
  optionSuccessStatus:200,
}

app.use(cors(corsOptions));


// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "API is running", timestamp: new Date().toISOString() });
});

app.use("/payment", paymentRoute);
app.use("/login", loginRoute);
app.use("/products", productsRoute);
app.use("/user", userRoute);
app.use("/register", registerRoute);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export for Vercel serverless
module.exports = app;
