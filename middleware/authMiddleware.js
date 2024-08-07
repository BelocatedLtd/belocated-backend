import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../model/User.js'

export const protect = asyncHandler(async (req, res, next) => {
	const authToken = req.headers.authorization?.split(' ')[1]
	console.log('🚀 ~ protect ~ authToken:', authToken)

	// console.log(authToken)
	// return

	if (!authToken) {
		res.status(401).json({ message: 'Not Authorized, no token' })
		throw new Error('Not Authorized, no token ')
	}

	try {
		const decoded = jwt.verify(authToken, process.env.JWT_SECRET)

		if (!decoded) {
			res.status(401).json({ message: 'Session Expired, please login' })
			throw new Error('Session Expired, please login')
		}

		req.user = await User.findById(decoded.id).select('-password')

		next()
	} catch (error) {
		res.status(401).json({ message: 'Not Authorized, invalid token' })
		throw new Error('Not authorized, invalid token')
	}
})
