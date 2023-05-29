import express from 'express'
import { fundUserWallet, getTransactions, getUserTransactions, getUserWallet } from '../controllers/transController.js';
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.get("/", protect, getUserWallet)
router.patch("/fund", protect, fundUserWallet)


router.get("/userall", protect, getUserTransactions)
router.get("/all", protect, getTransactions)




export default router;