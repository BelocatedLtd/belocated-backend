"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/register', userController_1.registerUser);
router.post('/refregister', userController_1.refRegisterUser);
router.post('/refchalregister', userController_1.refCahlRegisterUser);
router.post('/login', userController_1.loginUser);
// Get Routes
router.get('/', authMiddleware_1.protect, userController_1.getUser);
router.get('/all', authMiddleware_1.protect, userController_1.getUsers);
router.get('/dashboard', authMiddleware_1.protect, userController_1.getDashboardData);
router.get('/loggedin', userController_1.loginStatus);
//  router.get('/logout', logoutUser);
//Patch
router.patch('/update/', authMiddleware_1.protect, userController_1.updateUser);
router.patch('/update/accountdetails', authMiddleware_1.protect, userController_1.updateUserAccountDetails);
router.patch('/update/bankaccountdetails', authMiddleware_1.protect, userController_1.updateUserBankDetails);
router.post('/verifyoldpassword', authMiddleware_1.protect, userController_1.verifyOldPassword);
router.post('/send-referral-email', authMiddleware_1.protect, userController_1.sendReferralEmail);
router.post('/changePassword', authMiddleware_1.protect, userController_1.changePassword);
router.post('/forgotpassword', userController_1.forgotPassword);
//router.post("/verifyphone", protect, verifyUserPhone) //Send phone verification token
router.post('/authverification/:email', userController_1.verifyEmail); // Send Email verification link
router.post('/authverificationpassword/:email', userController_1.verifyEmailPasswordChange); // Send Email verification link for password change
router.patch('/emailverify/:token', userController_1.verifyUser); //Send phone verification OTP
//router.patch("/confirmphone", protect, confirmUserPhone) // Confirm Phone verification OTP
router.patch('/confirmemailOTP/:OTP', userController_1.confirmEmailOTP); // Confirm Phone verification OTP
router.post('/manage/:userId', authMiddleware_1.protect, userController_1.manageUser);
exports.default = router;
//# sourceMappingURL=userRoute.js.map