import { Response } from 'express'
import jwt from 'jsonwebtoken'

const generateToken = (res: Response, userId: string) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
		expiresIn: '1d',
	})

	res.cookie('jwt', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV !== 'development',
		sameSite: 'strict',
		maxAge: 1000 * 86400,
	})

	return token
}

export default generateToken
