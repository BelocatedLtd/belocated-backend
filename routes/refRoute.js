import express from 'express'
import {
	convertRefBonusPts,
	getAllRefChallenges,
	getAllUserReferrals,
	getOngoingRefChallenge,
	getReferralDashboardData,
} from '../controllers/refController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/challenge', getOngoingRefChallenge)
router.get('/challenge/all', protect, getAllRefChallenges)
router.get('/byUser', protect, getAllUserReferrals)
router.get('/dashboard', protect, getReferralDashboardData)


router.post('/bonus/convert', protect, convertRefBonusPts)

export default router
