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


app.use(cookieParser()); 

app.use(express.json());

const corsOptions ={
  origin: 'https://norli-clone.onrender.com/',
  credentials:true,            
  optionSuccessStatus:200,
}

app.use(cors(corsOptions));


app.use("/payment", paymentRoute);


app.use("/login", loginRoute);
app.use("/products", productsRoute);
app.use("/user", userRoute);
app.use("/register", registerRoute);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
