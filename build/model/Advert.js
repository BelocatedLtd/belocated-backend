"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const advertSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
}, {
    timestamps: true,
});
const Advert = mongoose_1.default.model('Advert', advertSchema);
exports.default = Advert;
//# sourceMappingURL=Advert.js.map