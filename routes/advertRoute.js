import express from 'express'
import { createAdvert, deleteAdvert, getAdvert, getAllAdvert, toggleAdvertFreeStatus } from "../controllers/advertController.js";
import protect from '../middleware/authMiddleware.js';
import multer from 'multer';

//Multer storage configuration
const  storage = multer.diskStorage({});
const upload =  multer({storage});


const router = express.Router();

router.post("/create", protect, upload.array('images'), createAdvert)
router.patch("/setadfree/:id", protect, toggleAdvertFreeStatus)
router.get("/", protect, getAdvert)
router.get("/all", getAllAdvert)

router.delete("/delete/:advertId", protect, deleteAdvert)




export default router;