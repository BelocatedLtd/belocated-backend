import express from 'express'
import { CreateNewTask, approveTask, getTask, getTasks, submitTask } from "../controllers/taskController.js";
import { upload } from '../utils/fileUpload.js'
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/create", protect, CreateNewTask)
router.post("/submit", protect, upload.single('mediaUrl'), submitTask)
router.patch("/approve", protect, approveTask)
router.get("/", protect, getTasks)
router.get("/task", protect, getTask)
// router.get("/all", getAllAdvert)




export default router;