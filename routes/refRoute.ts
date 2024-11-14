import express from 'express'
import {
	convertRefBonusPts,
	getAllRefChallenges,
	getAllUserReferrals,
	getOngoingRefChallenge,
	getReferralDashboardData,
	withdrawReferralEarnings,
} from '../controllers/refController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.get('/challenge', getOngoingRefChallenge)
router.get('/challenge/all', protect, getAllRefChallenges)
router.get('/byUser', protect, getAllUserReferrals)
router.get('/dashboard', protect, getReferralDashboardData)
router.post('/withdraw', protect, withdrawReferralEarnings)


router.post('/bonus/convert', protect, convertRefBonusPts)

export default router
