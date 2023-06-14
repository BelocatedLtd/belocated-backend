import express from 'express'
import { CreateNewTask, approveTask, getTask, getTasks, submitTask } from "../controllers/taskController.js";
import { upload } from '../utils/fileUpload.js'
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/create", protect, CreateNewTask)// User opts in to perform a task
router.post("/submit", protect, upload.single('mediaUrl'), submitTask)// User submits task after perfomring
router.patch("/approve", protect, approveTask) //Admin approves task and user gets paid
router.get("/", protect, getTasks)
router.get("/task", protect, getTask)
// router.get("/all", getAllAdvert)




export default router;