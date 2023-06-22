import express from 'express'
import { fundUserWallet, getTransactions, getUserTransactions, getUserWallet, getWallet } from '../controllers/transController.js';
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.get("/wallet", protect, getUserWallet)
router.get("/wallet/:userId", protect, getWallet)
router.patch("/fund", protect, fundUserWallet)


router.get("/userall", protect, getUserTransactions)
router.get("/all", protect, getTransactions)




export default router;