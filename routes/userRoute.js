import express from 'express'
import { registerUser, loginUser, getUser, getUsers, logoutUser, loginStatus, updateUser, forgotPassword, verifyEmail, verifyUser, verifyUserPhone, confirmUserPhone, updateUserAccountDetails, changePassword, verifyPasswordChange, deleteUser } from "../controllers/userController.js";
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

router.post("/verifypasswordchange", protect, verifyPasswordChange)
router.patch("/changePassword", protect, changePassword)
router.post("/forgotpassword", forgotPassword)

router.post("/verifyphone", protect, verifyUserPhone) //Send phone verification token
router.post("/authverification/:email", verifyEmail) // Send Email verification link
router.patch("/emailverify/:token", verifyUser) //Send phone verification OTP
router.patch("/confirmphone", protect, confirmUserPhone) // Confirm Phone verification OTP

router.delete("/delete/:userId", protect, deleteUser)

export default router;
