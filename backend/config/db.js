const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
        console.log(process.env.MONGO_URI);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;