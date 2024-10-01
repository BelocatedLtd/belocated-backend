import express from 'express'
import multer from 'multer'
import {
	approveTask,
	CreateNewTask,
	deleteTask,
	getTask,
	getTaskById,
	getTasks,
	rejectTask,
	submitTask,
} from '../controllers/taskController'
//import { upload } from '../utils/fileUpload.js'
//const upload = multer({ dest: 'uploads/' });
import { celebrate } from 'celebrate'
import { protect } from '../middleware/authMiddleware'
import { paginateSchema } from '../validate'

const router = express.Router()

//Multer storage configuration
const storage = multer.diskStorage({})
const upload = multer({ storage })

router.post('/create', protect, CreateNewTask) // User opts in to perform a task
router.post('/submit', protect, upload.array('images'), submitTask) // User submits task after perfomring
router.post('/approve', protect, approveTask) //Admin approves task and user gets paid
router.post('/reject', protect, rejectTask) //Admin rejects task
router.get(
	'/',
	protect,
	celebrate({
		query: paginateSchema,
	}),
	getTasks,
) // Get all tasks from db
// pagination
router.get(
	'/task',
	protect,
	celebrate({
		query: paginateSchema,
	}),
	getTask,
) // Gets a specific user tasks
router.get('/:id', protect, getTaskById) // Get all tasks from db

router.delete('/delete/:taskId', protect, deleteTask)

export default router
