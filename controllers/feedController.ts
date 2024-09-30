import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Feed from '../model/Feed'

// Save new Feed to DB
export const saveActivity = async (data: {
	userId: string
	action: string
}) => {
	const newActivity = await Feed.create({
		userId: data.userId,
		action: data.action,
	})

	if (!newActivity) {
		throw new Error('Failed to save new activity')
	}

	if (newActivity) {
		console.log('New activity saved!')
	}
}

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
	const activityFeed = await Feed.find().sort('-createdAt').limit(6)

	if (!activityFeed || activityFeed.length === 0) {
		res.status(404).json({ message: 'No activities found' })
		return
	}

	res.status(200).json(activityFeed)
})

export const trashFeed = asyncHandler(async (req: Request, res: Response) => {
	const activityFeed = await Feed.deleteMany()

	if (!activityFeed) {
		res.status(400).json('failed to trash activities')
		throw new Error('failed to trash activities')
	}

	if (activityFeed) {
		res.status(200).json('Feed Emptied')
	}
})
