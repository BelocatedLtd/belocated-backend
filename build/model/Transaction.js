"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const transactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    date: {
        type: String,
    },
    chargedAmount: {
        type: Number,
        required: true,
    },
    trxId: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentRef: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    trxType: {
        type: String,
        required: true,
        enum: ['wallet_funding', 'advert_payment'],
    },
}, {
    timestamps: true,
});
const Transaction = mongoose_1.default.model('Transaction', transactionSchema);
exports.default = Transaction;
//# sourceMappingURL=Transaction.js.map