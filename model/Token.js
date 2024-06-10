import mongoose from 'mongoose'

const tokenSchema = mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User',
	},
	token: {
		type: String,
	},
	emailVerificationToken: {
		type: String,
	},
	phoneVerificationOTP: {
		type: String,
	},
	referralToken: {
		type: String,
	},
	createdAt: {
		type: Date,
		required: true,
	},
	expiresAt: {
		type: Date,
		required: true,
	},
})

const Token = mongoose.model('Token', tokenSchema)
export default Token
