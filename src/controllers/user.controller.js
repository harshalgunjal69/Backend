import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
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
    if(!(coverImageLocalPath === undefined)){
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

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if(!createdUser){
        throw new ApiError(500, 'Failed to create user. Something went wrong.');
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User created successfully')
    )
});

export { registerUser };
