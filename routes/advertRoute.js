import express from 'express'
import { createAdvert, deleteAdvert, getAdvert, getAllAdvert, toggleAdvertFreeStatus } from "../controllers/advertController.js";
import { upload } from '../utils/fileUpload.js'
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/create", protect, upload.single('mediaURL'), createAdvert)
router.post("/setadfree/:advertId", protect, toggleAdvertFreeStatus)
router.get("/", protect, getAdvert)
router.get("/all", getAllAdvert)

router.delete("/delete/:advertId", protect, deleteAdvert)




export default router;