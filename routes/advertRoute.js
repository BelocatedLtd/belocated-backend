import express from 'express'
import { createAdvert, getAdvert, getAllAdvert } from "../controllers/advertController.js";
import { upload } from '../utils/fileUpload.js'
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/create", protect, upload.single('mediaURL'), createAdvert)
router.get("/", protect, getAdvert)
router.get("/all", getAllAdvert)




export default router;