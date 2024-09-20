import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		date: {
			type: String,
		},
		chargedAmount: {
			type: Number,
			required: true,
		},
		trxId: {
			type: String,
			required: true,
		},
		paymentMethod: {
			type: String,
			required: true,
		},
		paymentRef: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		trxType: {
			type: String,
			required: true,
			enum: ['wallet_funding', 'advert_payment'],
		},
	},
	{
		timestamps: true,
	},
)

const Transaction = mongoose.model('Transaction', transactionSchema)
export default Transaction
