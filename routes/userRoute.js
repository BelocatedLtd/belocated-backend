import express from 'express'
import { registerUser, loginUser, getUser, getUsers, logoutUser, loginStatus, updateUser, forgotPassword, verifyEmail, verifyUser, updateUserAccountDetails, changePassword, verifyPasswordChange, deleteUser, verifyEmailPasswordChange, confirmEmailOTP, verifyOldPassword } from "../controllers/userController.js";
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/register", registerUser)
router.post('/login', loginUser);

// Get Routes
router.get('/', protect, getUser);
 router.get('/all', protect, getUsers);
 router.get('/loggedin', loginStatus);
 router.get('/logout', logoutUser);

 //Patch
 router.patch('/update/', protect, updateUser)
 router.patch('/update/accountdetails', protect, updateUserAccountDetails)

router.post("/verifypasswordchange", verifyPasswordChange)
router.post("/verifyoldpassword", protect, verifyOldPassword)
router.patch("/changePassword", changePassword)
router.post("/forgotpassword", forgotPassword)

//router.post("/verifyphone", protect, verifyUserPhone) //Send phone verification token
router.post("/authverification/:email", verifyEmail) // Send Email verification link
router.post("/authverificationpassword/:email", verifyEmailPasswordChange) // Send Email verification link for password change
router.patch("/emailverify/:token", verifyUser) //Send phone verification OTP
//router.patch("/confirmphone", protect, confirmUserPhone) // Confirm Phone verification OTP 
router.patch("/confirmemailOTP/:OTP", confirmEmailOTP) // Confirm Phone verification OTP

router.delete("/delete/:userId", protect, deleteUser)

export default router;
