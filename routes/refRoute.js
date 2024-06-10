import express from 'express'
import { convertRefBonusPts, getAllRefChallenges, getAllUserReferrals, getOngoingRefChallenge } from '../controllers/refController.js';
import {protect} from '../middleware/authMiddleware.js';


const router = express.Router();


router.get("/challenge", getOngoingRefChallenge) // Get ongoing ref challenge from db
router.get("/challenge/all", protect, getAllRefChallenges) // Get ongoing ref challenge from db
router.get('/byUser', protect, getAllUserReferrals) // Get ongoing ref challenge from db

router.post("/bonus/convert", protect, convertRefBonusPts)


export default router;