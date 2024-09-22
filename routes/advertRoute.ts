import express from 'express'
import multer from 'multer'
import {
	createAdvert,
	deleteAdvert,
	getAdvert,
	getAdvertById,
	getAllAdvert,
	getQualifiedAdverts,
	getTotalTasksByAllPlatforms,
	initializeAdvert,
	toggleAdvertFreeStatus,
} from '../controllers/advertController'
import { protect } from '../middleware/authMiddleware'

//Multer storage configuration
const storage = multer.diskStorage({})
const upload = multer({ storage })

const router = express.Router()

router.post('/create', protect, upload.array('images'), createAdvert)
router.post('/initialize', protect, upload.array('images'), initializeAdvert)
router.post('/setadfree/:id', protect, toggleAdvertFreeStatus)
router.get('/', protect, getAdvert)
router.get('/all', getAllAdvert)

router.get('/qualified/:platformName', protect, getQualifiedAdverts)
router.get('/qualified', protect, getTotalTasksByAllPlatforms)

router.delete('/delete/:advertId', protect, deleteAdvert)

router.get('/:id', protect, getAdvertById)

export default router
