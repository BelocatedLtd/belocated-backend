import asyncHandler from 'express-async-handler';
import RefChallenge from '../model/RefChallenge.js';
import Referral from '../model/Referral.js';
import User from '../model/User.js';
import Wallet from '../model/Wallet.js';
//Get All Ongoing Challenge
// http://localhost:6001/api/ref/challenge/
export const getOngoingRefChallenge = asyncHandler(async (req, res) => {
    //const ongoingChallenge = await RefChallenge.findOne({status: "Ongoing"})
    const challenges = await RefChallenge.find();
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
export const getAllRefChallenges = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (req.user.accountType !== 'Admin' ||
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Not Authorized' });
        throw new Error('Not authorized');
    }
    if (req.user.accountType === 'Admin' ||
        req.user.accountType === 'Super Admin') {
        let challenges;
        challenges = await RefChallenge.find().sort('-createdAt');
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
export const convertRefBonusPts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ userId: req.user._id });
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
export const getAllUserReferrals = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // Find the referrer
    const referrer = await User.findById(userId);
    if (!referrer) {
        res.status(404).json({ message: 'Referrer not found' });
        return;
    }
    // Get all referrals made by the referrer
    const referrals = await Referral.find({ referrerId: userId });
    // Prepare the response data
    const referralData = await Promise.all(referrals.map(async (referral) => {
        const referredUser = referral.referredUserId
            ? await User.findById(referral.referredUserId)
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
export const getReferralDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const referrals = await Referral.find({ referrerId: userId });
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