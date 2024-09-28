"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const withdrawSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
    },
    withdrawAmount: {
        type: Number,
        required: true,
    },
    withdrawMethod: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
const Withdraw = mongoose_1.default.model('Withdraw', withdrawSchema);
exports.default = Withdraw;
//# sourceMappingURL=Withdraw.js.map