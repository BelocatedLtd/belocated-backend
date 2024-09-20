import mongoose from "mongoose";


const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0
    },
    refBonWallet: {
        type: Number,
        required: true,
        default: 0
    },
    totalEarning: {
        type: Number,
        required: true,
        default: 0
    },
    pendingBalance: {
        type: Number,
        required: true,
        default: 0
    },
    amountSpent: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
})

const Wallet = mongoose.model("Wallet", walletSchema)
export default Wallet;