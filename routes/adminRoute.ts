import express from 'express'
import { adminDashboard } from '../controllers/adminController'
import { adminProtect } from '../middleware/adminAuthMiddleware'

const router = express.Router()

router.get('/dashboard', adminProtect, adminDashboard)

export default router
