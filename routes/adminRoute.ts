import express from 'express'
import { adminDashboard, getUserDetails } from '../controllers/adminController'
import { adminProtect } from '../middleware/adminAuthMiddleware'

const router = express.Router()

router.get('/dashboard', adminProtect, adminDashboard)

router.get('/user/:id', adminProtect, getUserDetails)

export default router
