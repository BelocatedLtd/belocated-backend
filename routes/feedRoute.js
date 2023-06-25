import express from 'express';
import { getFeed } from '../controllers/feedController.js';

const router = express.Router();

// Define routes for activities
router.get("/", getFeed) // Gets a feed from db

export default router;