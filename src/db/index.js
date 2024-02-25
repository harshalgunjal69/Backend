import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection FAILED: ', error);
        process.exit(1);
    }
};

export default connectDB;
