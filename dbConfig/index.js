import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '@/models/userModel';

export default async function connect() {
    try {
        console.log("Connecting to MongoDB...");
        console.log("MongoDB URL: ", process.env.MONGODB_URL);
        
        await mongoose.connect(process.env.MONGODB_URL);
        const connect = mongoose.connection;

        connect.on('connected', () => console.log('MongoDB connected'));
        connect.on('error', (err) => {
            console.log(err)
            process.exit();
        });
    } catch (e) {
        console.log(e);
    }
}

export const getUserID = async (req) => {
    // Get user token
    const token = req.cookies?.token;
    if (!token) return "";

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) return "";
    return user._id;
}