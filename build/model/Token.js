"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const tokenSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    token: {
        type: String,
    },
    emailVerificationToken: {
        type: String,
    },
    phoneVerificationOTP: {
        type: String,
    },
    referralToken: {
        type: String,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});
tokenSchema.methods.isExpired = function () {
    return Date.now() > this.expiresAt;
};
const Token = mongoose_1.default.model('Token', tokenSchema);
exports.default = Token;
//# sourceMappingURL=Token.js.map