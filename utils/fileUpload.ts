import { Request } from 'express'
import multer from 'multer'

// /*  FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads')
	},
	filename: function (req, file, cb) {
		cb(
			null,
			new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname,
		)
	},
})

//Speify file format that can b saved
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'video/mp4'
	) {
		cb(null, true)
	} else {
		cb(null, false)
	}
}

// Increase the file size limit to 25MB (adjust as needed)
export const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 100 * 1024 * 1024 }, // Adjust the size limit as needed
})

//export const upload = multer({storage, fileFilter})

// File Size Formatter
export const fileSizeFormatter = (bytes: number, decimal: number = 2) => {
	if (bytes === 0) {
		return '0 Bytes'
	}
	const dm = decimal || 2
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'YB', 'ZB']
	const index = Math.floor(Math.log(bytes) / Math.log(1000))

	return (
		parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + ' ' + sizes[index]
	)
}
