import express from 'express'
import { getFeed, trashFeed } from '../controllers/feedController'

const router = express.Router()

// Define routes for activities
router.get('/', getFeed) // Gets a feed from db

router.delete('/trash', trashFeed) // Gets a feed from db

export default router
