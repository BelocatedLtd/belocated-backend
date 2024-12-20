import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		fullname: {
			type: String,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: [true, 'Please add a password'],
			minLength: [6, 'Password must be up to 6 characters'],
			//maxLength: [20, "Password must not be more than 20 characters"]
		},
		phone: {
			type: Number,
		},
		location: {
			type: String,
		},
		community: {
			type: String,
		},
		gender: {
			type: String,
		},
		religion: {
			type: String,
		},
		bankName: {
			type: String,
		},
		bankAccountNumber: {
			type: Number,
		},
		accountHolderName: {
			type: String,
		},
		referrersId: {
			type: String,
		},
		refChallengeReferrersId: {
			type: String,
		},
		adsCreated: {
			type: Number,
			default: 0,
		},
		taskOngoing: {
			type: Number,
			default: 0,
		},
		taskCompleted: {
			type: Number,
			default: 0,
		},
		accountType: {
			type: String,
			required: true,
			default: 'User', // Admin, Super Admin
		},
		accountStatus: {
			type: String,
			required: true,
			default: 'Active', // Banned, Suspended
		},
		isEmailVerified: {
			type: Boolean,
			required: true,
			default: false,
		},
		isKycDone: {
			type: Boolean,
			required: true,
			default: false,
		},
		// isPhoneVerified: {
		//     type: Boolean,
		//     required: true,
		//     default: false
		// },
		freeTaskCount: {
			type: Number,
			required: true,
			default: 2,
		},
		referralChallengePts: {
			type: Number,
			default: 0,
		},
		referralBonusPts: {
			type: Number,
			default: 0,
		},
		referralPoints: {
			type: Number,
			default: 0,
		},
		referralWithdrawals: [
			{
				amount: {
					type: Number,
					required: true,
				},
				date: {
					type: Date,
					required: true,
					default: Date.now,
				},
			},
		],
		referrals: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Referral',
			},
		],
		canAccessEarn: {
			type: Boolean,
			default: false
		},
	},
	{
		timestamps: true,
	},
)

//Encrypt password before saving to DB
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		return next()
	}

	//harsh password before saving to db
	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(this.password, salt)
	this.password = hashedPassword
	next()
})

const User = mongoose.model('User', userSchema)
export default User
