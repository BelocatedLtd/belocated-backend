"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const TaskSchema = new mongoose_1.default.Schema({
    advertId: { type: Schema.Types.ObjectId, ref: 'Advert' },
    advertiserId: {
        type: String,
        required: true,
    },
    taskPerformerId: {
        type: String,
        required: true,
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
}, {
    timestamps: true,
});
const Task = mongoose_1.default.model('Task', TaskSchema);
exports.default = Task;
//# sourceMappingURL=Task.js.map