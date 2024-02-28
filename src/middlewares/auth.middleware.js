import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/user.model';

export const verifyJWT = asyncHandler((req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'Unauthorized Access');
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = User.findById(decodedToken._id).selct(
            '-password -refreshToken'
        );
        if (!user) {
            throw new ApiError(401, 'Invalid Acess token');
        }

        req.user = user;
    } catch (error) {
        throw new ApiError(401, error.message || 'Invalid access token');
    }
    next();
});
