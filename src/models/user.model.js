import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required...'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required...'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required...'],
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //Cloudinary URL
            required: [true, 'Avatar is required...'],
        },
        coverImage: {
            type: String, //Cloudinary URL
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        password: {
            type: String,
            required: [true, 'Password is required...'],
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema);
