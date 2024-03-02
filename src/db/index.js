import {connect, disconnect} from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        await connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection FAILED: ', error);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await disconnect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Could not disconnect from MongoDB: ', error);
        process.exit(1);
    }
};

export default connectDB;
