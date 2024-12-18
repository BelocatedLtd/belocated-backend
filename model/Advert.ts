import mongoose from 'mongoose'

const advertSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		platform: {
			type: String,
			required: true,
		},
		service: {
			type: String,
			required: true,
		},
		adTitle: {
			type: String,
			required: true,
		},
		TD: {
			type: String,
			
		},
		desiredROI: {
			type: Number,
			required: true,
		},
		costPerTask: {
			type: Number,
			required: true,
		},
		earnPerTask: {
			type: Number,
			required: true,
		},
		gender: {
			type: String,
			required: true,
		},
		state: {
			type: String,
			required: true,
		},
		lga: {
			type: String,
			required: true,
		},
		caption: [{ type: String }],
		adAmount: {
			type: Number,
			required: true,
		},
		mediaURL: [
			{
				secure_url: { type: String },
				public_id: { type: String },
			},
		],
		socialPageLink: {
			type: String,
		},
		tasks: {
			type: Number, //Number of tasks completed so far, when it equals desiredROI, advert will be complete
			required: true,
		},
		status: {
			type: String, //Pending, Running, Allocating, Allocated, Completed
			required: true,
		},
		isFree: {
			type: Boolean,
			default: false,
		},
		tasksModerator: {
			type: String,
		},
		taskPerformers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	},
)

const Advert = mongoose.model('Advert', advertSchema)
export default Advert
