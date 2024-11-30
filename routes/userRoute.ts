import express from 'express'
import {
	changePassword,
	confirmEmailOTP,
	forgotPassword,
	getDashboardData,
	getUser,
	getUsers,
	loginStatus,
	loginUser,
	manageUser,
	refCahlRegisterUser,
	refRegisterUser,
	registerUser,
	sendReferralEmail,
	updateUser,
	updateUserAccountDetails,
	updateUserBankDetails,
	verifyEmail,
	verifyEmailPasswordChange,
	verifyOldPassword,
	verifyUser,
	checkCanAccessEarn,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.post('/register', registerUser)
router.post('/refregister', refRegisterUser)
router.post('/refchalregister', refCahlRegisterUser)
router.post('/login', loginUser)

// Get Routes
router.get('/', protect, getUser)
router.get('/all', protect, getUsers)
router.get('/dashboard', protect, getDashboardData)
router.get('/loggedin', loginStatus)
//  router.get('/logout', logoutUser);

//Patch
router.patch('/update/', protect, updateUser)
router.patch('/update/accountdetails', protect, updateUserAccountDetails)
router.patch('/update/bankaccountdetails', protect, updateUserBankDetails)

router.post('/verifyoldpassword', protect, verifyOldPassword)
router.post('/send-referral-email', protect, sendReferralEmail)
router.post('/changePassword', protect, changePassword)
router.post('/forgotpassword', forgotPassword)

//router.post("/verifyphone", protect, verifyUserPhone) //Send phone verification token
router.post('/authverification/:email', verifyEmail) // Send Email verification link
router.post('/authverificationpassword/:email', verifyEmailPasswordChange) // Send Email verification link for password change
router.patch('/emailverify/:token', verifyUser) //Send phone verification OTP
//router.patch("/confirmphone", protect, confirmUserPhone) // Confirm Phone verification OTP
router.patch('/confirmemailOTP/:OTP', confirmEmailOTP) // Confirm Phone verification OTP

router.post('/manage/:userId', protect, manageUser)
router.get('/can-access-earn', protect, checkCanAccessEarn);

export default router
