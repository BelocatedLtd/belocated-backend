import mongoose from "mongoose";

const refChallSchema = mongoose.Schema({
    firstId: {
        type: String,
    },
    secondId: {
        type: String,
    },
    thirdId: {
        type: String,
    },
    totalRefUsers: {
        type: Number, // Number of new users generated from challenge
        required: true,
        default: 0
    },
    status: {
        type: String,
        required: true,
        default: 'Ongoing' //!Completed (After 7 days of starting i.e 1 week)
    },
    referralChallengeContestants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    endDate: {
        type: Date,
    },
}, {
    timestamps: true
})

const RefChallenge = mongoose.model("RefChallenge", refChallSchema)
export default RefChallenge;