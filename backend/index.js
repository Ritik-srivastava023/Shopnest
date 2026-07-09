const express = require("express")
const cors = require("cors")
const dotenv =require("dotenv")
const connectDB = require("./config/db")
dotenv.config()
connectDB()
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("ShopNEST Website in Making")
})
app.use("/api/auth", require("./routes/authRoutes"));
app.use('/api/products', require('./routes/productRoutes.js'));
app.use('/api/orders', require('./routes/orderRoutes.js'));
app.use('/api/payment', require('./routes/paymentRoutes.js'));
app.use('/api/analytics', require('./routes/analyticsRoutes.js'));


const PORT = process.env.PORT || 5000;
app.listen(PORT,() =>{
    console.log(`Listening on port ${PORT}`);

})