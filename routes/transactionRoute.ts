import express from 'express'
import {
	confirmWithdrawalRequest,
	deleteWithdrawalRequest,
	fundUserWallet,
	getSingleUserWallet,
	getTransactions,
	getUserTransactions,
	getUserWallet,
	getUserWithdrawals,
	getWallet,
	getWithdrawals,
	handleFlutterwaveWebhook,
	handlePaystackWebhook,
	initializeTransaction,
	withdrawWallet,
	handleKoraPayWebhook,
	updateDocuments,
} from '../controllers/transController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.get('/wallet/user', protect, getUserWallet)
router.get('/wallet/:userId', protect, getWallet)
router.get('/wallet/user/:id', protect, getSingleUserWallet)
router.post('/fund', protect, fundUserWallet)
router.post('/withdraw', protect, withdrawWallet)
router.get('/withdrawals', protect, getWithdrawals)
router.get('/withdrawals/:id', protect, getUserWithdrawals)
router.patch(
	'/withdrawals/confirm/:withdrawalRequestId',
	protect,
	confirmWithdrawalRequest,
)
router.delete(
	'/withdrawals/delete/:withdrawalRequestId',
	protect,
	deleteWithdrawalRequest,
)

router.post('/initialize-transaction', initializeTransaction)
router.post('/paystack-webhook', handlePaystackWebhook)
router.post('/flutterwave-webhook', handleFlutterwaveWebhook)
router.post('/korapay-webhook', handleKoraPayWebhook)
//router.post('/updateDocs', updateDocuments)

router.get('/userall', protect, getUserTransactions)
router.get('/all', protect, getTransactions)

export default router
