import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log('Destination:', req.body);
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // console.log('Filename:', file);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
    },
    onError: function (err, cb) {
        console.error('Error storing file:', err);
        cb(err, null); // Pass the error to the callback, or handle it differently
    },
});

export const upload = multer({ storage });
