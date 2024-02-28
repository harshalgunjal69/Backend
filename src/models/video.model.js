import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, //Cloudinary URL
            required: [true, 'Video file is required...'],
            trim: true,
        },
        thumbnail: {
            type: String, //Cloudinary URL
            required: [true, 'Thumbnail is required...'],
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required...'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required...'],
            trim: true,
        },
        duration: {
            type: Number, //Cloudinary URL
            required: [true, 'Duration is required...'],
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            tye: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);
