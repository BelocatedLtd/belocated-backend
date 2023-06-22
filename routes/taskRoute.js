import express from 'express'
import { CreateNewTask, approveTask, deleteTask, getTask, getTasks, submitTask } from "../controllers/taskController.js";
import { upload } from '../utils/fileUpload.js'
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/create", protect, CreateNewTask)// User opts in to perform a task
router.post("/submit", protect, upload.single('mediaUrl'), submitTask)// User submits task after perfomring
router.patch("/approve", protect, approveTask) //Admin approves task and user gets paid
router.get("/", protect, getTasks) // Get all tasks from db
router.get("/task", protect, getTask) // Gets a specific user tasks

router.delete("/delete/:taskId", protect, deleteTask)




export default router;