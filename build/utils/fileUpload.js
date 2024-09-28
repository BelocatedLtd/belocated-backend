"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSizeFormatter = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// /*  FILE STORAGE */
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    },
});
//Speify file format that can b saved
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'video/mp4') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
// Increase the file size limit to 25MB (adjust as needed)
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // Adjust the size limit as needed
});
//export const upload = multer({storage, fileFilter})
// File Size Formatter
const fileSizeFormatter = (bytes, decimal = 2) => {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const dm = decimal || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'YB', 'ZB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1000));
    return (parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + ' ' + sizes[index]);
};
exports.fileSizeFormatter = fileSizeFormatter;
//# sourceMappingURL=fileUpload.js.map