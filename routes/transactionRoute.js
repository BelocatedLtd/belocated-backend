import express from 'express'
import { confirmWithdrawalRequest, deleteWithdrawalRequest, fundUserWallet, getTransactions, getUserTransactions, getUserWallet, getUserWithdrawals, getWallet, getWithdrawals, withdrawWallet } from '../controllers/transController.js';
import {protect} from '../middleware/authMiddleware.js';


const router = express.Router();

router.get("/wallet/user", protect, getUserWallet)
router.get("/wallet/:userId", protect, getWallet)
router.patch("/fund", protect, fundUserWallet)
router.post("/withdraw", protect, withdrawWallet)
router.get("/withdrawals", protect, getWithdrawals)
router.get("/withdrawals/:id", protect, getUserWithdrawals)
router.patch("/withdrawals/confirm/:withdrawalRequestId", protect, confirmWithdrawalRequest)
router.delete("/withdrawals/delete/:withdrawalRequestId", protect, deleteWithdrawalRequest)


router.get("/userall", protect, getUserTransactions)
router.get("/all", protect, getTransactions)




export default router;