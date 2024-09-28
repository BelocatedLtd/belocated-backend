"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endRefChallenge = exports.startRefChallenge = void 0;
const RefChallenge_1 = __importDefault(require("../model/RefChallenge"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
const sendEmailApi_1 = __importDefault(require("../utils/sendEmailApi"));
const startRefChallenge = async () => {
    console.log('Ref challenge cron job kicks off!');
    // Check whether any challenge is ongoing an close it
    const pastChallenges = await RefChallenge_1.default.find();
    // if (!pastChallenges) {
    //     console.log("No challenges found, going ahead to create new challenge")
    //     // Send message in form of email to the admin
    // }
    const hasOngoingChallenge = pastChallenges.some((pc) => pc.status === 'Ongoing');
    if (hasOngoingChallenge) {
        console.error("There's still an ongoing challenge, so new challenge cannot be created");
        return;
        // Send email to admin
    }
    // Create new challenge and set countdown timer
    //Create New Ref Challenge
    const newChallenge = await RefChallenge_1.default.create({
        firstId: '',
        secondId: '',
        thirdId: '',
        totalRefUsers: 0,
        status: 'Ongoing',
        referralChallengeContestants: [],
    });
    if (!newChallenge) {
        console.log('Failed to create new challenge');
    }
    if (newChallenge) {
        // Send email to admin notifying that new challenge for the week has being created and sending the details about the challenge to the admin.
        console.log('New challenge created');
    }
};
exports.startRefChallenge = startRefChallenge;
const endRefChallenge = async () => {
    // Check whether any challenge is ongoing an close it
    const pastChallenges = await RefChallenge_1.default.find();
    // if (!pastChallenges) {
    // console.log("No challenges found, going ahead to create new challenge")
    // // Send message in form of email to the admin
    // }
    const ongoingChallenge = pastChallenges.find((pc) => pc.status === 'Ongoing');
    if (!ongoingChallenge) {
        console.error("There's no challenge ongoing");
        return;
        // Send email to admin
    }
    // Close the challenge
    ongoingChallenge.status = 'Completed';
    const completedRefChallenge = await ongoingChallenge.save();
    if (!completedRefChallenge) {
        // Send email to admin
    }
    //Count how many times each contestant referred someone and sort out the contestant that referred the most
    const contestants = completedRefChallenge.referralChallengeContestants;
    const counts = {};
    contestants.forEach((item) => {
        counts[item] = (counts[item] || 0) + 1;
    });
    // Sort the contestants based on counts
    const sortedContestants = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (!sortedContestants) {
        console.log('There was a problem sorting the contestants');
    }
    // Select the contestant that referred the most; thus the winner
    const contestantFirstPosition = contestants[0];
    const contestantSecondPosition = contestants[1];
    const contestantThirdPosition = contestants[2];
    // Update the challenge with the winner
    completedRefChallenge.firstId = contestantFirstPosition.toString();
    completedRefChallenge.secondId = contestantSecondPosition.toString();
    completedRefChallenge.thirdId = contestantThirdPosition.toString();
    const updatedRefChallengeWinner = await completedRefChallenge.save();
    if (!updatedRefChallengeWinner) {
        // Send message to the admin
        console.log('There was a problem selecting the admin');
    }
    // Rewarding first position
    const firstPositionWallet = await Wallet_1.default.findOne({
        userId: 'contestantFirstPosition',
    });
    if (firstPositionWallet) {
        firstPositionWallet.value += 25000;
        await firstPositionWallet.save();
    }
    else {
        console.error('First position user wallet not found');
    }
    // Rewarding second position
    const secondPositionWallet = await Wallet_1.default.findOne({
        userId: 'contestantSecondPosition',
    });
    if (secondPositionWallet) {
        secondPositionWallet.value += 15000;
        await secondPositionWallet.save();
    }
    else {
        console.error('Second position user wallet not found');
    }
    // Rewarding first position
    const thirdPositionWallet = await Wallet_1.default.findOne({
        userId: 'contestantThirdPosition',
    });
    if (thirdPositionWallet) {
        thirdPositionWallet.value += 10000;
        await thirdPositionWallet.save();
    }
    else {
        console.error('Third position user wallet not found');
    }
    //Reset every users refferal points and so everybody can start from scratch on the next challenge
    try {
        // Update all users to set referralPoints to 0
        await User_1.default.updateMany({}, { $set: { referralChallengePts: 0, referralChallengeReferredUsers: [] } });
        console.log('Users updated.');
    }
    catch (error) {
        console.error('Error occurred while resetting referral points:', error);
    }
    //Send Welcome Email
    const message = `
    <h2>Hello, Admin</h2>
    <p>This email is to notify that the system has automatically ended the ongoing referral challenge</p>

    <p>Kindly log into the admin dashboard to see the result of the challenge</p>
    <p>BELOCATED Admin</p>
    `;
    const subject = 'Referral Challenge Ended';
    const send_to = 'jayveloper@stackithub.com';
    const reply_to = 'noreply@noreply.com';
    const username = 'Admin';
    //Finally sending email
    const emailSent = await (0, sendEmailApi_1.default)(subject, message, send_to, username);
    if (!emailSent) {
        // res.status(500).json('Failed to send welcome email')
        throw new Error('Failed to send welcome email');
    }
    console.log('Ongoing Challenge Completed');
};
exports.endRefChallenge = endRefChallenge;
//# sourceMappingURL=refChallCron.js.map