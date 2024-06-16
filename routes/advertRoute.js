import express from 'express'
import {
	createAdvert,
	deleteAdvert,
	getAdvert,
	getAllAdvert,
	getQualifiedAdverts,
	toggleAdvertFreeStatus,
} from '../controllers/advertController.js'
import { protect } from '../middleware/authMiddleware.js'
import multer from 'multer'

//Multer storage configuration
const storage = multer.diskStorage({})
const upload = multer({ storage })

const router = express.Router()

router.post('/create', protect, upload.array('images'), createAdvert)
router.post('/setadfree/:id', protect, toggleAdvertFreeStatus)
router.get('/', protect, getAdvert)
router.get('/all', getAllAdvert)

router.get('/qualified/:platformName', protect, getQualifiedAdverts)

router.delete('/delete/:advertId', protect, deleteAdvert)

export default router
