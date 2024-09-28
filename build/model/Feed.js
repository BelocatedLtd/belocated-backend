"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FeedSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
const Feed = mongoose_1.default.model('Feed', FeedSchema);
exports.default = Feed;
//# sourceMappingURL=Feed.js.map