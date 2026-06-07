const multer = require("multer");
const path = require("path");
const imagekit = require("./imagekit");
const { error } = require("console");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const allowedMimeTypes = /image\/(jpeg|jpg|png)|application\/pdf/;

        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedMimeTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            error("File type not allowed. Only PDF and Images (JPEG, JPG, PNG) are accepted.");
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});