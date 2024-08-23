import express from 'express'
import { adminDashboard } from '../controllers/adminController.js'
import { adminProtect } from '../middleware/adminAuthMiddleware.js'

const router = express.Router()

router.get('/dashboard', adminProtect, adminDashboard)

export default router
