import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validate the user details - if all the fields are present or not
    // check if user already exists in database - username, email
    // if user exists send error response to frontend
    // check if the user has uploaded a profile picture/avatar
    // if yes, upload the image to cloudinary
    // check for the image uploaded to cloudinary successfully or not
    // if yes, save the user details to a new user object
    // create a new user in the database
    // remove the password and the refreshToken from the response
    // check for user creation success or failure
    // if success, send the response to the frontend

    const { fullName, email, username, password } = req.body;
    console.log(req.body);

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(409, 'User already exists');
    }

    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            'Avatar is required. Avatar not found in request body'
        );
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    let coverImage;
    if (!(coverImageLocalPath === undefined)) {
        coverImage = await uploadToCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(
            400,
            'Avatar is required. Failed to upload avatar to cloudinary'
        );
    }

    const user = await User.create({
        fullName: fullName,
        email: email,
        username: username.toLowerCase(),
        password: password,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
    });

    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    if (!createdUser) {
        throw new ApiError(500, 'Failed to create user. Something went wrong.');
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, 'User created successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
    // Take the data from the frontend - username/email and password
    // Validate the user details - if all fields are present or not
    // Check if the username/email exists in database
    // If yes, check if the password is correct or not using isPasswordCorrect method
    // create an access token and a refresh token+
    const generateAccessAndRefreshTokens = async (userId) => {
        try {
            const user = await User.findById(userId);
            const accessToken = await user.generateAccessToken();
            const refreshToken = await user.generateRefreshToken();

            user.refreshToken = refreshToken;
            user.save({ validateBeforeSave: false });

            return { accessToken, refreshToken };
        } catch (error) {
            return new ApiError(
                500,
                'Something went wrong while generating access and refresh tokens'
            );
        }
    };

    const { email, username, password } = req.body;
    // console.log(email);
    // console.log(req.body);

    if (!username && !email) {
        throw new ApiError(400, 'Username or email is required');
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged In Successfully'
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // clear the cookies
    // send a response to frontend
    const userId = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(201)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refresh token from the cookies
    // check if the refresh token is present or not
    // if not, send an error response to the frontend
    // if yes, verify the refresh token
    // if the refresh token is invalid, send an error response to the frontend
    // if the refresh token is valid, create a new access token
    // send the new access token to the frontend

    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
        // async (err, decoded) => {
        //     if (err) {
        //         throw new ApiError(401, 'Invalid refresh token');
        //     }

        //     const user = await User.findById(decoded._id);
        // }
    );

    const user = await User.findById(decodedToken?._id).select('-password');

    if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(
            401,
            'Refresh token is expired or used. Please login again.'
        );
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    const options = {
        httpOnly: true,
        secure: true,
    };

    res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken },
                'Access token refreshed successfully'
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    // get the user id from the request object
    // find the user by id
    // send the user details to the frontend
    const user = req.user;
    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User details fetched successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // get the user id from the request object
    // get the old password and the new password from the request object
    // validate the old password and the new password
    // check if the old password is correct or not
    // if not, send an error response to the frontend
    // if yes, update the password in the database
    // send a response to the frontend
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id).select('-refreshToken');

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, 'Password is not valid.');
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
};
