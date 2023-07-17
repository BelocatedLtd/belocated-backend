import express from 'express'
import multer from 'multer'
import { CreateNewTask, approveTask, deleteTask, getTask, getTasks, rejectTask, submitTask } from "../controllers/taskController.js";
//import { upload } from '../utils/fileUpload.js'
//const upload = multer({ dest: 'uploads/' });
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

//Multer storage configuration
const  storage = multer.diskStorage({});
const upload =  multer({storage});


router.post("/create", protect, CreateNewTask)// User opts in to perform a task
router.post("/submit", protect, upload.array('images'), submitTask)// User submits task after perfomring
router.post("/approve", protect, approveTask) //Admin approves task and user gets paid
router.post("/reject", protect, rejectTask) //Admin rejects task
router.get("/", protect, getTasks) // Get all tasks from db
router.get("/task", protect, getTask) // Gets a specific user tasks

router.delete("/delete/:taskId", protect, deleteTask)




export default router;