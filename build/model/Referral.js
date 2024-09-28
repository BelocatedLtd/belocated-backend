"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const referralSchema = new mongoose_1.default.Schema({
    referrerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referredUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
const Referral = mongoose_1.default.model('Referral', referralSchema);
exports.default = Referral;
//# sourceMappingURL=Referral.js.map