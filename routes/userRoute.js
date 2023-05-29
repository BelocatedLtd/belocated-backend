import express from 'express'
import { registerUser, loginUser, getUser, getUsers, logoutUser, loginStatus, updateUser, forgotPassword } from "../controllers/userController.js";
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
//  router.patch("/changepassword", protect, changePassword)
router.post("/forgotpassword", forgotPassword)
// router.post("/authverification", confirmEmail)



export default router;
