"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.getUserTransactions = exports.getUserWithdrawals = exports.deleteWithdrawalRequest = exports.confirmWithdrawalRequest = exports.getWithdrawals = exports.withdrawWallet = exports.handleFlutterwaveWebhook = exports.handlePaystackWebhook = exports.initializeTransaction = exports.fundUserWallet = exports.getSingleUserWallet = exports.getWallet = exports.getUserWallet = void 0;
const crypto = __importStar(require("crypto"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Advert_1 = __importDefault(require("../model/Advert"));
const Transaction_1 = __importDefault(require("../model/Transaction"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
const Withdraw_1 = __importDefault(require("../model/Withdraw"));
//Get User Wallet
exports.getUserWallet = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const wallet = await Wallet_1.default.findOne({ userId: req.user._id });
        if (!wallet) {
            res.status(400).json('No User Wallet Found');
        }
        else {
            res.status(200).json(wallet);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//Get User Wallet
exports.getWallet = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId } = req.params;
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Not Authorized' });
        throw new Error('Not Authorized');
    }
    const wallet = await Wallet_1.default.findOne({ userId });
    if (!wallet) {
        res.status(400).json({ message: 'No User Wallet Found' });
        throw new Error('No User Wallet Found');
    }
    res.status(200).json(wallet);
});
//Get Single User Wallet
exports.getSingleUserWallet = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Not Authorized' });
        throw new Error('Not Authorized');
    }
    const wallet = await Wallet_1.default.findOne({ userId: id });
    if (!wallet) {
        res.status(400).json({ message: 'No User Wallet Found' });
        throw new Error('No User Wallet Found');
    }
    res.status(200).json(wallet);
});
//Fund User Wallet
exports.fundUserWallet = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, email, date, chargedAmount, trxId, paymentRef, status } = req.body;
    // Validation
    if (!userId || !chargedAmount || !trxId || !paymentRef) {
        res.status(400).json({ message: 'Some required fields are missing!' });
        throw new Error('Some required fields are empty');
    }
    // Validation
    //  if ( status ==! "Approved Successful" ) {
    //     res.status(400).json('This payment has not being approved');
    //     throw new Error("This payment has not being approved")
    //  }
    // Match userId from req.body with server logged in user
    //  if (userId !== req.user._id) {
    //     res.status(401).json("User not authorized 1")
    // }
    try {
        // Getting user wallet
        const wallet = await Wallet_1.default.findOne({ userId: req.user._id });
        if (!wallet) {
            res.status(400).json({ message: 'Wallet not found' });
            throw new Error('wallet not found');
        }
        // Match existing wallet to the loggedin user
        if (wallet.userId !== userId) {
            res.status(401).json({ message: 'User not authorized 2' });
            throw new Error('User not authorized 2');
        }
        // Update User wallet
        const updatedUserWallet = await Wallet_1.default.updateOne({ userId: req.user._id }, {
            $inc: { value: chargedAmount },
        }, {
            new: true,
            runValidators: true,
        });
        if (!updatedUserWallet) {
            res.status(401).json({ message: 'Faild to fund wallet, contact Admin' });
            throw new Error('Faild to fund wallet, contact Admin');
        }
        if (updatedUserWallet) {
            //Create New Transaction
            const transaction = await Transaction_1.default.create({
                userId,
                email,
                date,
                chargedAmount,
                trxId,
                paymentRef,
                trxType: 'wallet_funding',
                status,
            });
            if (transaction) {
                const updatedWallet = await Wallet_1.default.findOne({ userId: req.user._id });
                res.status(201).json(updatedWallet);
            }
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.initializeTransaction = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, email, amount, paymentRef, date, advertId, paymentMethod, paymentType, } = req.body;
    // Validation
    if (!userId || !email || !amount || !paymentMethod) {
        res.status(400).json({ message: 'Some required fields are missing!' });
        throw new Error('Some required fields are empty');
    }
    try {
        const existingTransaction = await Transaction_1.default.findOne({ paymentRef });
        if (existingTransaction) {
            res.status(400).json({
                message: 'A transaction with this payment reference already exists!',
            });
            return;
        }
        // Create New Transaction
        const transaction = await Transaction_1.default.create({
            userId,
            email,
            chargedAmount: amount,
            paymentMethod,
            paymentRef,
            date,
            trxType: paymentType,
            status: 'Pending',
            trxId: advertId ? `ad_p${advertId}` : `ad_p${paymentRef}`,
        });
        if (transaction) {
            res.status(201).json(transaction);
        }
        else {
            res.status(400).json({ message: 'Failed to initialize transaction' });
            throw new Error('Failed to initialize transaction');
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.handlePaystackWebhook = (0, express_async_handler_1.default)(async (req, res) => {
    // Verify the event (using Paystack's verification method)
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = req.headers['x-paystack-signature'];
    if (!secret) {
        throw new Error('Invalid secret');
    }
    const hashDigest = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (hash !== hashDigest) {
        throw new Error('Invalid request signature');
    }
    const event = req.body;
    if (event.event === 'charge.success') {
        const { reference, amount, customer, status } = event.data;
        try {
            // Find the transaction
            const transaction = await Transaction_1.default.findOne({ paymentRef: reference });
            if (!transaction) {
                res.status(404).json({ message: 'Transaction not found' });
                throw new Error('Transaction not found');
            }
            // Update the transaction status
            transaction.status = status;
            await transaction.save();
            const advertId = transaction.trxId.split('ad_p')[1];
            if (!advertId) {
                res.status(400).json({ message: 'Invalid transaction ID format' });
                throw new Error('Invalid transaction ID format');
            }
            // Find the advert
            const advert = await Advert_1.default.findById(advertId);
            if (!advert) {
                res.status(404).json({ message: 'Advert not found' });
                throw new Error('Advert not found');
            }
            // Fund the user wallet if transaction is successful
            if (status === 'success') {
                advert.status = 'Running';
                await advert.save();
                res.status(200);
            }
            else {
                res.status(400).json({ message: 'Transaction not successful' });
            }
        }
        catch (error) {
            res.status(500).json({ error });
        }
    }
    else {
        res.status(400).json({ message: 'Event not handled' });
    }
});
exports.handleFlutterwaveWebhook = (0, express_async_handler_1.default)(async (req, res) => {
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== secretHash) {
        // This request isn't from Flutterwave; discard
        res.status(401).end();
    }
    const payload = req.body;
    const { txRef, amount, customer, status } = payload;
    try {
        // Find the transaction
        const transaction = await Transaction_1.default.findOne({ paymentRef: txRef });
        console.log('🚀 ~ handleFlutterwaveWebhook ~ transaction:', transaction);
        if (!transaction) {
            res.status(404);
            throw new Error('Transaction not found');
        }
        // Update the transaction status
        transaction.status = status;
        await transaction.save();
        if (transaction.trxType === 'wallet_funding') {
            if (status === 'successful') {
                const wallet = await Wallet_1.default.findOne({ userId: transaction.userId });
                if (!wallet) {
                    throw new Error('Wallet not found');
                }
                wallet.value += amount;
                wallet.totalEarning += amount;
                await wallet.save();
                res.status(200).json({ message: 'Wallet funded successfully' });
            }
            else {
                throw new Error('Transaction not successful');
            }
        }
        else if (transaction.trxType === 'advert_payment') {
            const advertId = transaction.trxId.split('ad_p')[1];
            if (!advertId) {
                throw new Error('Invalid transaction ID format');
            }
            const advert = await Advert_1.default.findById(advertId);
            if (!advert) {
                throw new Error('Advert not found');
            }
            if (status === 'successful') {
                advert.status = 'Running';
                await advert.save();
                res.status(200);
            }
            else {
                res.status(400).json({ message: 'Transaction not successful' });
            }
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//Withdraw User Wallet
exports.withdrawWallet = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, withdrawAmount, withdrawalMethod } = req.body;
    // Validation
    if (!userId || !withdrawAmount || !withdrawalMethod) {
        res.status(400).json({ message: 'Some required fields are missing!' });
        throw new Error('Some required fields are empty');
    }
    const user = await User_1.default.findById(req.user._id);
    if (!user) {
        throw new Error('User not found');
    }
    const wallet = await Wallet_1.default.findOne({ userId: user._id });
    // Validation
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        throw new Error('User not found');
    }
    if (!wallet) {
        res.status(400).json({ message: 'User Wallet not found' });
        throw new Error('User Wallet not found');
    }
    if (wallet.value >= withdrawAmount) {
        try {
            // Update User wallet
            wallet.value -= withdrawAmount;
            const updatedUserWallet = await wallet.save();
            if (!updatedUserWallet) {
                res
                    .status(401)
                    .json({ message: 'Faild to withdraw from wallet, contact Admin' });
                throw new Error('Faild to fund wallet, contact Admin');
            }
            let withdrawalRequest;
            if (updatedUserWallet) {
                withdrawalRequest = await Withdraw_1.default.create({
                    userId,
                    withdrawAmount,
                    status: 'Pending Approval',
                    withdrawMethod: withdrawalMethod,
                });
                if (!withdrawalRequest) {
                    res
                        .status(500)
                        .json({ message: 'Error creating withdrawal request' });
                    throw new Error('Error creating withdrawal request');
                }
                //Create New Transaction
                const transaction = await Transaction_1.default.create({
                    userId: userId,
                    email: user === null || user === void 0 ? void 0 : user.email,
                    date: Date.now(),
                    chargedAmount: withdrawAmount,
                    trxId: `wd-${userId}`,
                    paymentRef: withdrawalRequest._id,
                    trxType: `Withdraw by - ${withdrawalMethod}`,
                    status: 'Pending Approval',
                });
                if (!transaction) {
                    throw new Error('Error creating transaction');
                }
            }
            res.status(200).json(wallet);
        }
        catch (error) {
            res.status(500).json({ error });
        }
    }
    else {
        res.status(500).json({ message: 'Insufficient Balance' });
        throw new Error('Insufficient Balance');
    }
});
//Get all user Withdrawals
exports.getWithdrawals = (0, express_async_handler_1.default)(async (req, res) => {
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Unauthorized user' });
        throw new Error('Unauthorized user');
    }
    try {
        const withdrawals = await Withdraw_1.default.find().sort('-createdAt');
        if (!withdrawals) {
            res.status(400).json({ message: 'Withdrawal request list empty' });
            throw new Error('Withdrawal request list empty');
        }
        if (withdrawals) {
            res.status(200).json(withdrawals);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//Confirm Withdrawal Request
exports.confirmWithdrawalRequest = (0, express_async_handler_1.default)(async (req, res) => {
    const { withdrawalRequestId } = req.params;
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Unauthorized user' });
        throw new Error('Unauthorized user');
    }
    const wdRequest = await Withdraw_1.default.findById(withdrawalRequestId);
    const wdTrx = await Transaction_1.default.findOne({ paymentRef: withdrawalRequestId });
    if (!wdRequest) {
        res.status(400).json({ message: 'Cannot find withdrawal request' });
        throw new Error('Cannot find withdrawal request');
    }
    if (!wdTrx) {
        res.status(400).json({ message: 'Cannot find withdrawal trx' });
        throw new Error('Cannot find withdrawal trx');
    }
    if (wdRequest.status === 'Approved') {
        res
            .status(400)
            .json({ message: 'This withdrawal request has already being approved' });
        throw new Error('This withdrawal request has already being approved');
    }
    //Update task status after user submit screenshot
    const updatedwdRequest = await Withdraw_1.default.findByIdAndUpdate({ _id: withdrawalRequestId }, {
        status: 'Approved',
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedwdRequest) {
        res.status(500).json({ message: 'Error trying to update task status' });
        throw new Error('Failed to approve task');
    }
    if (updatedwdRequest) {
        //Update trx status
        const updatedTrx = await Transaction_1.default.updateOne({ paymentRef: withdrawalRequestId }, {
            status: 'Approved',
        });
        if (!updatedTrx) {
            res.status(500).json({ message: 'Error trying to update trx status' });
            throw new Error('Error trying to update trx status');
        }
    }
    res.status(200).json(updatedwdRequest);
});
//Delete Withdrawal Request
// TODO: only admin can delete
exports.deleteWithdrawalRequest = (0, express_async_handler_1.default)(async (req, res) => {
    const { withdrawalRequestId } = req.params;
    // const wdRequest = await Withdraw.findById(withdrawalRequestId)
    const wdTrx = await Transaction_1.default.find({ paymentRef: withdrawalRequestId });
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Unauthorized user' });
        throw new Error('Unauthorized user');
    }
    const wdRequest = await Withdraw_1.default.findById(withdrawalRequestId);
    if (!wdRequest) {
        throw new Error('Withdrawal request does not exist or already deleted');
    }
    if (wdRequest.status == 'Approved') {
        res
            .status(400)
            .json({ message: 'Withdrawal request has already been approved' });
        throw new Error('Withdrawal request has already been approved');
    }
    if (!wdRequest) {
        res.status(400).json({
            message: 'Withdrawal request does not exist or already deleted',
        });
        throw new Error('Withdrawal request does not exist or already deleted');
    }
    const delWdRequest = await Withdraw_1.default.findByIdAndDelete(withdrawalRequestId);
    if (!delWdRequest) {
        res.status(500).json({ message: 'Error Deleting' });
        throw new Error('Error Deleting');
    }
    if (delWdRequest) {
        //Update task status after user submit screenshot
        const updatedTrx = await Transaction_1.default.updateOne({ paymentRef: withdrawalRequestId }, {
            status: 'Rejected',
        });
        // Put back the user's money back to their wallet
        const updateUserWallet = await Wallet_1.default.updateOne({ userId: wdRequest.userId }, {
            $inc: { value: +wdRequest.withdrawAmount },
        });
        if (!updatedTrx || !updateUserWallet) {
            res.status(500).json({
                message: 'Error trying to update trx status and user wallet',
            });
            throw new Error('Error trying to update trx status and user wallet');
        }
    }
    const wdRequests = await Withdraw_1.default.find().sort('-createdAt');
    res.status(200).json(wdRequests);
});
//Get user Transactions
// http://localhost:6001/api/transactions/userall
exports.getUserWithdrawals = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id } = req.user;
    try {
        const withdrawals = await Withdraw_1.default.find({ userId: _id }).sort('-createdAt');
        if (!withdrawals) {
            res.status(400).json({
                message: 'Cannot find any withdrawal request made by this user',
            });
            throw new Error('Cannot find any withdrawal request made by this user');
        }
        if (withdrawals) {
            res.status(200).json(withdrawals);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//Get user Transactions
// http://localhost:6001/api/transactions/userall
exports.getUserTransactions = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const transactions = await Transaction_1.default.find({
            userId: req.user._id,
        }).sort('-createdAt');
        if (!transactions) {
            res
                .status(400)
                .json({ message: 'Cannot find any transaction made by this user' });
            throw new Error('Cannot find any transaction made by this user');
        }
        if (transactions) {
            res.status(200).json(transactions);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
/*  GET ALL TRANSACTIONS */
// http://localhost:6001/api/transactions/all
exports.getTransactions = (0, express_async_handler_1.default)(async (req, res) => {
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(400).json({ message: 'Not authorized' });
        throw new Error('Not authorized');
    }
    const transactions = await Transaction_1.default.find().sort('-createdAt');
    if (!transactions) {
        res.status(400).json({ message: 'No transaction found in the database' });
        throw new Error('No transaction found in the database');
    }
    res.status(200).json(transactions);
});
//# sourceMappingURL=transController.js.map