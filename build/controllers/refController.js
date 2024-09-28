"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferralDashboardData = exports.getAllUserReferrals = exports.convertRefBonusPts = exports.getAllRefChallenges = exports.getOngoingRefChallenge = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const RefChallenge_1 = __importDefault(require("../model/RefChallenge"));
const Referral_1 = __importDefault(require("../model/Referral"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
//Get All Ongoing Challenge
// http://localhost:6001/api/ref/challenge/
exports.getOngoingRefChallenge = (0, express_async_handler_1.default)(async (req, res) => {
    //const ongoingChallenge = await RefChallenge.findOne({status: "Ongoing"})
    const challenges = await RefChallenge_1.default.find();
    if (!challenges) {
        res.status(400).json({ message: 'No referral challenge found' });
    }
    const ongoingChallenge = challenges.find((ch) => ch.status === 'Ongoing');
    if (!ongoingChallenge) {
        res.status(400).json({ message: 'No ongoing challenge found' });
    }
    res.status(200).json(ongoingChallenge);
});
//Get All Referral Challenge
// http://localhost:6001/api/tasks
exports.getAllRefChallenges = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id } = req.user;
    if (req.user.accountType !== 'Admin' ||
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Not Authorized' });
        throw new Error('Not authorized');
    }
    if (req.user.accountType === 'Admin' ||
        req.user.accountType === 'Super Admin') {
        let challenges;
        challenges = await RefChallenge_1.default.find().sort('-createdAt');
        if (!challenges) {
            res.status(400).json({ message: 'Cannot find any referral challenge' });
            throw new Error('Cannot find any referral challen');
        }
        if (challenges) {
            res.status(200).json(challenges);
        }
    }
});
/*  CONVERT REF BONUS TO WALLLET FUNDS */
// http://localhost:6001/api/transactions/all
exports.convertRefBonusPts = (0, express_async_handler_1.default)(async (req, res) => {
    const user = await User_1.default.findById(req.user._id);
    const wallet = await Wallet_1.default.findOne({ userId: req.user._id });
    if (!user) {
        res.status(400).json({ message: 'User not found' });
        throw new Error('User not found');
    }
    if (!wallet) {
        res.status(400).json({ message: 'Wallet not found' });
        throw new Error('Wallet not found');
    }
    //
    wallet.value += user.referralBonusPts;
    const updatedWallet = wallet.save();
    if (!updatedWallet) {
        res.status(501).json('Ref bonus points failed to convert');
    }
    user.referralBonusPts = 0;
    const updatedUser = user.save();
    if (!updatedUser) {
        res.status(501).json('Failed to reset user ref bonus point');
    }
    res.status(200).json('Ref bonus points successfully converted');
});
exports.getAllUserReferrals = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user._id;
    // Find the referrer
    const referrer = await User_1.default.findById(userId);
    if (!referrer) {
        res.status(404).json({ message: 'Referrer not found' });
        return;
    }
    // Get all referrals made by the referrer
    const referrals = await Referral_1.default.find({ referrerId: userId });
    // Prepare the response data
    const referralData = await Promise.all(referrals.map(async (referral) => {
        const referredUser = referral.referredUserId
            ? await User_1.default.findById(referral.referredUserId)
            : null;
        return {
            referralId: referral._id,
            referredUsername: referredUser ? referredUser.username : null,
            referredEmail: referral.referredEmail,
            referredDate: referral.referralDate,
            pointsEarned: referral.pointsEarned,
            status: referral.status,
        };
    }));
    res.status(200).json(referrals);
});
exports.getReferralDashboardData = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user._id;
    const user = await User_1.default.findById(userId);
    const referrals = await Referral_1.default.find({ referrerId: userId });
    if (!user) {
        res.status(404).json({ message: 'Referrer not found' });
        return;
    }
    const refDashboardData = {
        totalPoints: user.referralPoints,
        referredUsers: referrals.length,
        totalEarning: 0,
        challengesWon: 0,
    };
    res.status(200).json(refDashboardData);
});
//# sourceMappingURL=refController.js.map