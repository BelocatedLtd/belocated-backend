import { celebrate } from 'celebrate'
import express from 'express'
import multer from 'multer'
import {
	approveTask,
	CreateNewTask,
	deleteTask,
	getTask,
	getTaskById,
	getTasks,
	getTasksByAdvertId,
	getTasksByUserId,
	rejectTask,
	submitTask,
	remainingApprovedTasks,
	remainingCompletedTask,
	getRemainingTasksByPlatform,
	checkRemainingTask,
	getAllSubmittedTask,
} from '../controllers/taskController'
import { protect } from '../middleware/authMiddleware'
import { paginateSchema } from '../validate'

const router = express.Router()

//Multer storage configuration
const storage = multer.diskStorage({})
const upload = multer({ storage })

router.post('/create', protect, CreateNewTask)
router.post('/submit', protect, upload.array('images'), submitTask)
router.post('/approve', protect, approveTask)
router.post('/reject', protect, rejectTask)
router.get(
	'/',
	protect,
	getTasks,
)
router.get(
	'/user/:userId',
	protect,
	celebrate({
		query: paginateSchema,
	}),
	getTasksByUserId,
)

router.get('/advert/:advertId', protect, getTasksByAdvertId);

// pagination
router.get(
	'/task',
	protect,
	celebrate({
		query: paginateSchema,
	}),
	getTask,
)
router.get('/:id', protect, getTaskById)
router.get('/tasking/:id', protect, getTaskById)
router.get('/remaining/:userId', protect, remainingCompletedTask);
router.get('/approved/:userId', protect, remainingApprovedTasks);
router.get('/submitted', protect, getAllSubmittedTask)
router.get('/remaining-tasks/:userId/:platform', protect, getRemainingTasksByPlatform);
router.get('/check/:advertId/:performerId', protect, checkRemainingTask);


router.delete('/delete/:taskId', protect, deleteTask)

export default router
