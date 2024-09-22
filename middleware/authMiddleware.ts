import { NextFunction, Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../model/User'

export const protect = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const authToken = req.headers.authorization?.split(' ')[1]
		console.log('🚀 ~ protect ~ authToken:', authToken)

		// console.log(authToken)
		// return

		if (!authToken) {
			throw new Error('Not Authorized, no token ')
		}

		try {
			console.log('🚀 ~ process.env.JWT_SECRET:', process.env.JWT_SECRET)

			const decoded: any = jwt.verify(
				authToken,
				process.env.JWT_SECRET as string,
			)
			console.log('🚀 ~ decoded:', decoded)

			if (!decoded) {
				throw new Error('Session Expired, please login')
			}

			req.user = await User.findById(decoded.id).select('-password')

			next()
		} catch (error) {
			res.status(401).json({ message: error })
		}
	},
)
