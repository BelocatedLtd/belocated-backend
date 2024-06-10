import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema(
	{
		referrerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		referredUserId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: false,
		},
		referredName: {
			type: String,
			required: false,
		},
		referredEmail: {
			type: String,
			required: true,
		},
		referralDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		pointsEarned: {
			type: Number,
			required: true,
			default: 0,
		},
		status: {
			type: String,
			required: true,
			enum: ['Sent', 'Pending', 'Completed', 'Failed'],
			default: 'Pending',
		},
	},
	{
		timestamps: true,
	},
)

const Referral = mongoose.model('Referral', referralSchema)
export default Referral
