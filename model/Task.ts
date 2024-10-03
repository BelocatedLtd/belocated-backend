import mongoose from 'mongoose'
const Schema = mongoose.Schema

const TaskSchema = new mongoose.Schema(
	{
		// advertId: { type: Schema.Types.ObjectId, ref: 'Advert' },
		advertId: {
			type: Schema.Types.Mixed,
			ref: 'Advert',
			required: true,
			validate: {
				validator: function (v: mongoose.Types.ObjectId | string) {
					return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string'
				},
				message: 'advertId must be either an ObjectId or String',
			},
		},
		taskPerformerId: {
			type: Schema.Types.Mixed,
			ref: 'User',
			required: true,
			validate: {
				validator: function (v: mongoose.Types.ObjectId | string) {
					return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string'
				},
				message: 'taskPerformerId must be either an ObjectId or String',
			},
		},
		advertiserId: {
			type: Schema.Types.Mixed,
			ref: 'User',
			required: true,
			validate: {
				validator: function (v: mongoose.Types.ObjectId | string) {
					return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string'
				},
				message: 'advertiserId must be either an ObjectId or String',
			},
		},
		title: {
			type: String,
			required: true,
		},
		platform: {
			type: String, //whatsApp, Facebook, IG, Twitter and Tiktok
			required: true,
		},
		service: {
			type: String,
			required: true,
		},
		desiredROI: {
			type: String, // no. of advert posts you expect to get
			required: true,
		},
		toEarn: {
			type: Number, // Amount to earn after performing a task
			required: true,
		},
		gender: {
			type: String, // Male, Female, Both
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
		caption: {
			type: String,
		},
		taskVerification: {
			type: String,
			required: true,
		},
		socialPageLink: {
			type: String,
		},
		proofOfWorkMediaURL: [
			{
				secure_url: { type: String },
				public_id: { type: String },
			},
		],
		nameOnSocialPlatform: {
			type: String,
			default: '',
		},

		status: {
			type: String,
			required: true,
			enum: [
				'Awaiting Submission',
				'Submitted',
				'Pending Approval',
				'Approved',
				'Completed',
				'Rejected',
			],
			default: 'Awaiting Submission',
		},
		adMedia: {
			type: Array,
		},
		message: {
			type: String,
			default: '', // Take the message that conveys the reason why Admin rejected task submission
		},
	},
	{
		timestamps: true,
	},
)

const Task = mongoose.model('Task', TaskSchema)
export default Task
