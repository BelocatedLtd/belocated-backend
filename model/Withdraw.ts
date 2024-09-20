import mongoose from 'mongoose'

const withdrawSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		withdrawAmount: {
			type: Number,
			required: true,
		},
		withdrawMethod: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	},
)

const Withdraw = mongoose.model('Withdraw', withdrawSchema)
export default Withdraw
