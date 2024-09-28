"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transController_1 = require("../controllers/transController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/wallet/user', authMiddleware_1.protect, transController_1.getUserWallet);
router.get('/wallet/:userId', authMiddleware_1.protect, transController_1.getWallet);
router.get('/wallet/user/:id', authMiddleware_1.protect, transController_1.getSingleUserWallet);
router.patch('/fund', authMiddleware_1.protect, transController_1.fundUserWallet);
router.post('/withdraw', authMiddleware_1.protect, transController_1.withdrawWallet);
router.get('/withdrawals', authMiddleware_1.protect, transController_1.getWithdrawals);
router.get('/withdrawals/:id', authMiddleware_1.protect, transController_1.getUserWithdrawals);
router.patch('/withdrawals/confirm/:withdrawalRequestId', authMiddleware_1.protect, transController_1.confirmWithdrawalRequest);
router.delete('/withdrawals/delete/:withdrawalRequestId', authMiddleware_1.protect, transController_1.deleteWithdrawalRequest);
router.post('/initialize-transaction', transController_1.initializeTransaction);
router.post('/paystack-webhook', transController_1.handlePaystackWebhook);
router.post('/flutterwave-webhook', transController_1.handleFlutterwaveWebhook);
router.get('/userall', authMiddleware_1.protect, transController_1.getUserTransactions);
router.get('/all', authMiddleware_1.protect, transController_1.getTransactions);
exports.default = router;
//# sourceMappingURL=transactionRoute.js.map