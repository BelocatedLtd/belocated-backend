import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../model/User.js'

export const adminProtect = asyncHandler(async (req, res, next) => {
	const authToken = req.headers.authorization?.split(' ')[1]

	if (!authToken) {
		res.status(401).json({ message: 'Not Authorized, no token' })
		throw new Error('Not Authorized, no token')
	}

	try {
		const decoded = jwt.verify(authToken, process.env.JWT_SECRET)

		if (!decoded) {
			res.status(401).json({ message: 'Session Expired, please login' })
			throw new Error('Session Expired, please login')
		}

		const user = await User.findById(decoded.id).select('-password')

		if (!user) {
			res.status(401).json({ message: 'Not Authorized, user not found' })
			throw new Error('Not Authorized, user not found')
		}

		if (user.accountType !== 'Admin' && user.accountType !== 'Super Admin') {
			res.status(403).json({ message: 'Not Authorized, admin access only' })
			throw new Error('Not Authorized, admin access only')
		}

		req.user = user

		next()
	} catch (error) {
		res.status(401).json({ message: 'Not Authorized, invalid token' })
		throw new Error('Not authorized, invalid token')
	}
})
