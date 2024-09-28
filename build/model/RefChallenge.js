"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const refChallSchema = new mongoose_1.default.Schema({
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
        default: 0,
    },
    status: {
        type: String,
        required: true,
        default: 'Ongoing', //!Completed (After 7 days of starting i.e 1 week)
    },
    referralChallengeContestants: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    endDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
const RefChallenge = mongoose_1.default.model('RefChallenge', refChallSchema);
exports.default = RefChallenge;
//# sourceMappingURL=RefChallenge.js.map