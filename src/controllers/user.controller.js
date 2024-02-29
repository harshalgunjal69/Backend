import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validate the user details - if all the fields are present or not
    // check if user already exixts in database - username, email
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
            user = User.findById(userId);
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

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

    const { username, email, password } = req.body;
    if (!username) {
        throw new ApiError(400, 'Username or email is required.');
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        return new ApiError(404, 'User does not exists');
    }

    if (!password) {
        return new ApiError(400, 'Password is required');
    }

    const isPasswordValid = user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = User.findById(user._id).select(
        '-password -refreshToken'
    );

    options = {
        httpOnly: true,
        secure: true,
    };
    

    return res
        .status(200)
        .cookie('refreshToken', refreshToken, options)
        .cookie('accessToken', accessToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                'User logged in successfully'
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

    options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(201)
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

export { registerUser, loginUser, logoutUser };
