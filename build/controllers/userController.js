"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = exports.sendReferralEmail = exports.manageUser = exports.confirmEmailOTP = exports.verifyUser = exports.verifyEmailPasswordChange = exports.verifyEmail = exports.forgotPassword = exports.changePassword = exports.verifyOldPassword = exports.updateUserBankDetails = exports.updateUserAccountDetails = exports.updateUser = exports.loginStatus = exports.getUsers = exports.getUser = exports.loginUser = exports.refCahlRegisterUser = exports.refRegisterUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Advert_1 = __importDefault(require("../model/Advert"));
const RefChallenge_1 = __importDefault(require("../model/RefChallenge"));
const Referral_1 = __importDefault(require("../model/Referral"));
const Task_1 = __importDefault(require("../model/Task"));
const Token_1 = __importDefault(require("../model/Token"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const sendEmailApi_1 = __importDefault(require("../utils/sendEmailApi"));
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jsonwebtoken_1.default.sign({ id }, secret, { expiresIn: '1d' });
};
//>>>> Register User
// http://localhost:6001/api/user/register
exports.registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { username, email, password, referralToken, referralUsername } = req.body;
    if (!username || !email || !password) {
        throw new Error('Please fill in all required fields');
    }
    const emailExists = await User_1.default.findOne({ email: email });
    if (emailExists) {
        throw new Error('Email has already been registered, please login');
    }
    let user;
    user = await User_1.default.create({
        fullname: '',
        username,
        password,
        email,
        phone: null,
        bankName: '',
        bankAccountNumber: '',
        accountHolderName: '',
        location: '',
        community: '',
        religion: '',
        gender: '',
        accountType: 'User',
        accountStatus: 'Active',
        referrersId: '',
        isEmailVerified: false,
        isPhoneVerified: false,
        taskCompleted: 0,
        taskOngoing: 0,
        adsCreated: 0,
        freeTaskCount: 2,
        referCount: 0,
        referrals: [],
        referralChallengePts: 0,
        referralBonusPts: 0,
        referralPoints: 0,
        referralChallengeReferredUsers: [],
    });
    if (!user) {
        throw new Error('Failed to register User');
    }
    const wallet = await Wallet_1.default.create({
        userId: user._id,
        value: 0,
        totalEarning: 0,
        pendingBalance: 0,
        amountSpent: 0,
    });
    if (!wallet) {
        throw new Error('Failed to Create Wallet for Registered User, Please contact admin');
    }
    const { _id, username: registeredUsername, email: registeredEmail, isEmailVerified, } = user;
    const userData = {
        _id,
        username: registeredUsername,
        email: registeredEmail,
        isEmailVerified,
    };
    if (referralToken) {
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(referralToken)
            .digest('hex');
        const token = await Token_1.default.findOne({ referralToken: hashedToken });
        if (token) {
            const referrerId = token.userId;
            const referrer = await User_1.default.findById(referrerId);
            const referral = await Referral_1.default.findOneAndUpdate({ referredEmail: email }, {
                referredUserId: _id,
                referredName: username,
                status: 'Pending',
            }, {
                new: true,
                runValidators: true,
            });
        }
    }
    else if (referralUsername) {
        const referredUser = await User_1.default.findOne({ username: referralUsername });
        const referral = await Referral_1.default.findOneAndUpdate({ referredEmail: email }, {
            referredUserId: _id,
            referredName: username,
            status: 'Pending',
        }, {
            new: true,
            runValidators: true,
        });
    }
    res.status(200).json(userData);
});
//>>>> Register User For Ref Bonus
// http://localhost:6001/api/user/refregister
exports.refRegisterUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { username, email, password, refusername } = req.body;
        //User input validation
        if (!username || !email || !password || !refusername) {
            throw new Error('Please fill in all required fields');
        }
        if (!refusername) {
            throw new Error('No referrer data recorded');
        }
        //Check if the referrer still exist
        const userRef = await User_1.default.findOne({ username: refusername });
        if (!userRef) {
            throw new Error('Referrer does not exist');
        }
        //checking for password lenght
        if (password.length < 6) {
            throw new Error('Password must be upto 6 characters');
        }
        //check if user email already exist or username
        const usernameOrEmailExists = await User_1.default.findOne({
            $or: [{ username }, { email }],
        });
        if (usernameOrEmailExists) {
            throw new Error('Username or Email has already been registered by another user');
        }
        //Create new user
        const user = await User_1.default.create({
            fullname: '',
            username,
            password,
            email,
            phone: null,
            bankName: '',
            bankAccountNumber: '',
            accountHolderName: '',
            location: '',
            community: '',
            religion: '',
            gender: '',
            accountType: 'User',
            accountStatus: 'Active',
            referrersId: refusername,
            isEmailVerified: false,
            isPhoneVerified: false,
            taskCompleted: 0,
            taskOngoing: 0,
            adsCreated: 0,
            freeTaskCount: 2,
            referCount: 0,
            referrals: [],
            referralChallengePts: 0,
            referralBonusPts: 0,
            referralChallengeReferredUsers: [],
        });
        if (!user) {
            throw new Error('Failed to register User');
        }
        //Create new wallet for User
        let wallet;
        if (user) {
            wallet = await Wallet_1.default.create({
                userId: user._id,
                value: 0,
                refBonWallet: 0,
                totalEarning: 0,
                pendingBalance: 0,
                amountSpent: 0,
            });
        }
        if (!wallet) {
            throw new Error('Failed to Create Wallet for Registered User, Please contact admin');
        }
        //Update the referrer's referredUser's array
        userRef.referrals.push(user._id);
        const referrer = await userRef.save();
        if (!referrer) {
            throw new Error('Internal error with referral system from the server');
        }
        if (user && wallet && referrer) {
            const { _id, username, email, referrersId, isEmailVerified } = user;
            const userData = {
                _id,
                username,
                email,
                referrersId,
                isEmailVerified,
            };
            res.status(200).json(userData);
        }
        if (!user && !wallet) {
            throw new Error('Registeration failed');
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//>>>> Register User For Ref Challenge
// http://localhost:6001/api/user/refChalregister
exports.refCahlRegisterUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { username, email, password, refusername } = req.body;
        // res.status(200).json(req.body)
        // return
        //User input validation
        if (!username || !email || !password || !refusername) {
            throw new Error('Please fill in all required fields');
        }
        if (!refusername) {
            throw new Error('No referrer data recorded');
        }
        //Check if the referrer still exist
        const userRef = await User_1.default.findOne({ username: refusername });
        if (!userRef) {
            throw new Error('Referrer does not exist');
        }
        //checking for password lenght
        if (password.length < 6) {
            throw new Error('Password must be upto 6 characters');
        }
        //check if user email already exist
        //username
        const usernameOrEmailExists = await User_1.default.findOne({
            $or: [{ username }, { email }],
        });
        if (usernameOrEmailExists) {
            throw new Error('Username or Email has already been registered by another user');
        }
        //Create new user
        const user = await User_1.default.create({
            fullname: '',
            username,
            password,
            email,
            phone: null,
            bankName: '',
            bankAccountNumber: '',
            accountHolderName: '',
            location: '',
            community: '',
            religion: '',
            gender: '',
            accountType: 'User',
            accountStatus: 'Active',
            referrersId: '',
            refChallengeReferrersId: refusername,
            isEmailVerified: false,
            isPhoneVerified: false,
            taskCompleted: 0,
            taskOngoing: 0,
            adsCreated: 0,
            freeTaskCount: 2,
            referCount: 0,
            referrals: [],
            referralChallengePts: 0,
            referralBonusPts: 0,
            referralChallengeReferredUsers: [],
        });
        if (!user) {
            throw new Error('Failed to register User');
        }
        //Create new wallet for User
        let wallet;
        if (user) {
            wallet = await Wallet_1.default.create({
                userId: user._id,
                value: 0,
                refBonWallet: 0,
                totalEarning: 0,
                pendingBalance: 0,
                amountSpent: 0,
            });
        }
        if (!wallet) {
            throw new Error('Failed to Create Wallet for Registered User, Please contact admin');
        }
        if (user && wallet) {
            const { _id, username, email, referrersId, isEmailVerified } = user;
            const userData = {
                _id,
                username,
                email,
                referrersId,
                isEmailVerified,
            };
            res.status(200).json(userData);
        }
        if (!user && !wallet) {
            throw new Error('Registeration failed');
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//>>>> Login User
// http://localhost:6001/api/user/login
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    //validate login request
    if (!email || !password) {
        throw new Error('Please add details to login');
    }
    //Check if user exist
    const user = await User_1.default.findOne({ email });
    //if user doesnt exist
    if (!user) {
        throw new Error('User not found, please Register');
    }
    //when user exist - check if password is correct
    const passwordIsCorrect = await bcryptjs_1.default.compare(password, user.password);
    if (!passwordIsCorrect) {
        throw new Error('Incorrect Password');
    }
    //if user doesnt exist
    if (user.accountStatus === 'Banned') {
        throw new Error('User account Banned, send an email to appeal@belocated.ng to appeal');
    }
    //Check if user email is verified
    if (user.isEmailVerified === false) {
        const { username, email, isEmailVerified } = user;
        const userData = {
            username,
            email,
            isEmailVerified,
        };
        res.status(200).json(userData);
        return;
    }
    if (user.isEmailVerified === true) {
        //   res.status(400).json({message: "Error trying to log into your account, please contact admin"})
        //  throw new Error("Error trying to log into your account, please contact admin")
        //Generate token
        const token = generateToken(user._id);
        //send HTTP-Only cookie
        //  res.cookie("token", token,
        //  {
        //    httpOnly: true,
        //    withCredentials: true,
        //    expires: new Date(Date.now() + 1000 * 86400), // 1 day
        //    sameSite: "none",
        //    secure: true
        //  });
        if (user && passwordIsCorrect && token) {
            const walletId = await Wallet_1.default.find({ userId: user._id });
            const { _id, fullname, username, email, phone, location, community, religion, gender, accountType, accountStatus, bankName, bankAccountNumber, accountHolderName, isEmailVerified, taskCompleted, taskOngoing, adsCreated, freeTaskCount, referrals, referrersId, refChallengeReferrersId, referralChallengePts, referralBonusPts, isKycDone, } = user;
            res.status(200).json({
                id: _id,
                fullname,
                username,
                email,
                phone,
                location,
                community,
                religion,
                gender,
                accountType,
                accountStatus,
                bankName,
                bankAccountNumber,
                accountHolderName,
                isEmailVerified,
                taskCompleted,
                taskOngoing,
                adsCreated,
                freeTaskCount,
                referrals,
                referrersId,
                refChallengeReferrersId,
                referralChallengePts,
                referralBonusPts,
                isKycDone,
                token,
            });
        }
        else {
            throw new Error('Invalid user email or Password');
        }
    }
});
//>>>> GET User
// http://localhost:6001/api/user/:id
exports.getUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            res.status(400).json({ msg: 'Cannot find user' });
            throw new Error('Cannot find user');
        }
        //Generate token
        const token = generateToken(user._id);
        if (user) {
            const { _id, fullname, username, email, phone, location, community, religion, gender, accountType, accountStatus, bankName, bankAccountNumber, accountHolderName, isEmailVerified, taskCompleted, taskOngoing, adsCreated, freeTaskCount, referrals, referrersId, refChallengeReferrersId, referralChallengePts, referralBonusPts, isKycDone, } = user;
            res.status(200).json({
                id: _id,
                fullname,
                username,
                email,
                phone,
                location,
                community,
                religion,
                gender,
                accountType,
                accountStatus,
                bankName,
                bankAccountNumber,
                accountHolderName,
                isEmailVerified,
                taskCompleted,
                taskOngoing,
                adsCreated,
                freeTaskCount,
                referrals,
                referrersId,
                refChallengeReferrersId,
                referralChallengePts,
                referralBonusPts,
                token,
                isKycDone,
            });
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//>>>>  GET ALL USERS
// http://localhost:6001/api/user/all
exports.getUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const users = await User_1.default.find({}, { password: 0 });
    if (!users) {
        res.status(400);
        throw new Error('No User found in the database');
    }
    if (users) {
        res.status(200).json(users);
    }
});
//>>>>  LOGOUT USERS
// http://localhost:6001/api/user/logout
// export const logoutUser = asyncHandler(async(req: Request, res: Response) => {
//     return res.status(200).json("Successfully Logged Out")
// })
//>>>> Get Login Status
exports.loginStatus = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const authToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!authToken) {
        res.json(false);
    }
    //Verify token
    const verified = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
    if (verified) {
        res.json(true);
    }
    else {
        res.json(false);
    }
});
//>>>> Update User details
exports.updateUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, fullname, phone, state, lga, gender, religion } = req.body;
    console.log('🚀 ~ updateUser ~ userId:', userId);
    // if (userId !== req.user._id) {
    // 	return res
    // 		.status(400)
    // 		.json({ message: "There's a problem with the validation for this user" })
    // }
    const user = await User_1.default.findById(req.user._id);
    //When request is not found
    if (!user) {
        res.status(404).json('User not found in DB');
    }
    const updatedUserDetails = await User_1.default.findByIdAndUpdate({ _id: req.user.id }, {
        fullname: fullname || req.user.fullname,
        phone: phone || req.user.phone,
        location: state || req.user.state,
        community: lga || req.user.lga,
        gender: gender || req.user.gender,
        religion: religion || req.user.religion,
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedUserDetails) {
        res.status(404).json('Failed to update user details');
        throw new Error('Failed to update user details');
    }
    if (updatedUserDetails) {
        const { _id, fullname, username, email, phone, location, community, religion, gender, accountType, accountStatus, bankName, bankAccountNumber, accountHolderName, isEmailVerified, 
        // isPhoneVerified,
        taskCompleted, taskOngoing, adsCreated, freeTaskCount, referrals, referrersId, refChallengeReferrersId, 
        // referralChallengeReferredUsers,
        referralChallengePts, referralBonusPts, } = updatedUserDetails;
        res.status(200).json({
            id: _id,
            fullname,
            username,
            email,
            phone,
            location,
            community,
            religion,
            gender,
            accountType,
            accountStatus,
            bankName,
            bankAccountNumber,
            accountHolderName,
            isEmailVerified,
            // isPhoneVerified,
            taskCompleted,
            taskOngoing,
            adsCreated,
            freeTaskCount,
            referrals,
            referrersId,
            refChallengeReferrersId,
            // referralChallengeReferredUsers,
            referralChallengePts,
            referralBonusPts,
        });
    }
    else {
        res.status(400).json({ message: 'Invalid Updated User Details' });
    }
});
exports.updateUserAccountDetails = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, username, email, phone } = req.body;
    //check if username and email already exist
    //username
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    //Check if user is authorized to make this update
    // if (user.isPhoneVerified === false) {
    //   res.status(401).json({message: "You are not allowed to make this change, complete phone number verification"})
    //   throw new Error({message: "You are not allowed to make this change, complete phone number verification"})
    // }
    //if (user.isPhoneVerified === true) {
    // Check if new email has already being registered by another user
    if (email && email !== user.email) {
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            throw new Error('Email already taken');
        }
    }
    // Check if new username has already being registered by another user
    if (username && username !== user.username) {
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            throw new Error('Username already taken');
        }
    }
    // Check if new phone number has already being registered by another user
    if (phone && phone !== user.phone) {
        const existingUser = await User_1.default.findOne({ phone });
        if (existingUser) {
            throw new Error('Phone number is already in use');
        }
    }
    //Update User Account Details
    const updatedUser = await User_1.default.findByIdAndUpdate({ _id: userId }, {
        email: email || req.user.email,
        username: username || req.user.username,
        phone: phone || req.user.phone,
    });
    if (!updatedUser) {
        throw new Error('Failed to updated user account details');
    }
    const { password, ...userData } = updatedUser.toObject();
    res.status(200).json(userData);
    //}
});
//Update Bank Account Details
exports.updateUserBankDetails = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userId, bankName, accountHolderName, bankAccountNumber } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            throw new Error('User not found');
        }
        // Check if new bankAccountName && Account Number has already being registered by another user
        if (bankAccountNumber && bankAccountNumber !== user.bankAccountNumber) {
            const existingUser = await User_1.default.findOne({ bankAccountNumber });
            if (existingUser) {
                throw new Error('Bank Details already in use');
            }
        }
        const isKycDone = !!(user.fullname &&
            user.phone &&
            user.location &&
            user.community &&
            user.gender);
        //Update User Account Details
        const updatedUser = await User_1.default.findByIdAndUpdate({ _id: userId }, {
            bankName: bankName || req.user.bankName,
            accountHolderName: accountHolderName || req.user.accountHolderName,
            bankAccountNumber: bankAccountNumber || req.user.bankAccountNumber,
            isKycDone: isKycDone,
        }, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser) {
            throw new Error('Failed to updated user bank account details');
        }
        if (updatedUser.isKycDone) {
            const referral = await Referral_1.default.findOne({ referredUserId: userId });
            if (referral && referral.status !== 'Completed') {
                referral.status = 'Completed';
                referral.pointsEarned += 10;
                await referral.save();
                const referrer = await User_1.default.findById(referral.referrerId);
                console.log('🚀 ~ updateUserBankDetails ~ referrer:', referrer);
                if (referrer) {
                    referrer.referralPoints += 10;
                    await referrer.save();
                }
            }
            const { password, ...userData } = updatedUser.toObject();
            res.status(200).json({ ...userData, id: userData._id });
        }
        //}
    }
    catch (error) {
        res.status(500).json(error);
    }
});
//>>>> Verify Old user password
exports.verifyOldPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, oldPassword } = req.body;
    const user = await User_1.default.findById(req.user._id);
    // Check if user exist
    if (!user) {
        res.status(400).json({ message: 'User not found, please register' });
        throw new Error('User not found, please register');
    }
    //validate password
    if (!oldPassword) {
        res.status(400).json({ message: 'Please add old password' });
        throw new Error('Please add old password');
    }
    // check if old password matches password in the db
    const passwordIsCorrect = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!passwordIsCorrect) {
        res.status(400).json({ message: 'Password is Incorrect' });
        throw new Error('Password is Incorrect');
    }
    if (passwordIsCorrect) {
        res.status(200).json('Password is Correct');
    }
});
//>>>> Change user old password
exports.changePassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { newPassword, oldPassword } = req.body;
    const userId = req.user._id;
    const user = await User_1.default.findById(userId);
    //Check if user exist
    if (!user) {
        res.status(400).json({ message: 'User not found, please register' });
        throw new Error('User not found, please register');
    }
    //validate password
    if (!newPassword || !oldPassword) {
        res.status(400).json({ message: 'unauthorized change' });
        throw new Error('unauthorized change');
    }
    // check if old password matches password in the db
    const passwordIsCorrect = await bcryptjs_1.default.compare(oldPassword, user.password);
    //save new password
    if (user && passwordIsCorrect) {
        user.password = newPassword;
        await user.save();
        res.status(200).json('Password changed successfully');
    }
    else {
        res.status(400);
        throw new Error('Old password is incorrect');
    }
});
//>>>> Reset Password
exports.forgotPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, email, newPassword } = req.body;
    //checking for password lenght
    if (newPassword.length < 6) {
        res.status(400).json({ message: 'Password must be upto 6 characters' });
        throw new Error('Password must be upto 6 characters');
    }
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User does not exist' });
        throw new Error('User does not exist');
    }
    //save new password
    if (user) {
        user.password = newPassword;
        const passwordChanged = await user.save();
        if (!passwordChanged) {
            res.status(500).json({ message: 'Error changing password' });
        }
        if (passwordChanged) {
            res.status(200).json('Password changed successfully');
        }
    }
});
//>>>> Send and resend Verification Email
exports.verifyEmail = (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.params;
    const user = await User_1.default.findOne({ email: email.toLowerCase() });
    if (!user) {
        res.status(404).json('No user found');
        throw new Error('No user found');
    }
    if (user) {
        //Delete token if it exists in the DB
        let token = await Token_1.default.findOne({ userId: user._id });
        if (token) {
            await token.deleteOne();
        }
        // generate new verification token
        let verificationToken = crypto_1.default.randomBytes(32).toString('hex') + user._id;
        //Hask token before saving to DB
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        //Save Token to DB
        const saveTokenToDB = await new Token_1.default({
            userId: user._id,
            token: '',
            emailVerificationToken: hashedToken,
            phoneVerificationOTP: '',
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
        }).save();
        if (!saveTokenToDB) {
            res.status(500);
            throw new Error('Internal server Error');
        }
        if (saveTokenToDB) {
            // Contruct frontendURL
            const frontendUrl = process.env.FRONTEND_URL;
            const verificationLink = `${frontendUrl}/verified?token=${verificationToken}`;
            //Send Verification Email
            const message = `
    <h2>Hello, ${user.username}</h2>
    <p>Welcome to BeLocated!</p>
    <p>We are excited to have you join the BeLocated family.</p>
    <p>To get you started, you would have to verify your email by clicking the link below.</p>
    <p>Note that the reset link is valid for 30minutes</p>
    <p>Once you are verified you can proceed to login and access all our earning and publicity packages.</p>

    <p>We are here to serve you so contact us on any of our social media pages with any question you may have</p>

    <p>Your verification link is:</p>

    <a href=${verificationLink} clicktracking=off>${verificationLink}</a>

    <p>Regards,</p>
    <p>Belocated Team</p>
    `;
            const subject = 'Verification Email';
            const send_to = email;
            const reply_to = 'noreply@noreply.com';
            //Finally sending email
            //const emailSent = await sendEMail(subject, message, send_to, reply_to)
            const response = await (0, sendEmailApi_1.default)(subject, message, send_to, user.username);
            if (!response) {
                res.status(500).json('Email verification failed');
                throw new Error('Email verification failed');
            }
            if (response) {
                res.status(200).json('Verification Email Sent Successfully');
            }
        }
    }
});
//>>>> Send and resend Password Verification Email
exports.verifyEmailPasswordChange = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email } = req.params;
        console.log('🚀 ~ verifyEmailPasswordChange ~ email:', email.toLowerCase());
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        console.log('🚀 ~ verifyEmailPasswordChange ~ user:', user);
        if (!user) {
            res.status(404).json('No user found');
            throw new Error('No user found');
        }
        if (user) {
            //Delete token if it exists in the DB
            let token = await Token_1.default.findOne({ userId: user._id });
            if (token) {
                await token.deleteOne();
            }
            // generate new verification token
            let verificationToken = crypto_1.default
                .randomBytes(3)
                .toString('hex')
                .toUpperCase();
            console.log('🚀 ~ verifyEmailPasswordChange ~ verificationToken:', verificationToken);
            //Hask token before saving to DB
            const hashedToken = crypto_1.default
                .createHash('sha256')
                .update(verificationToken)
                .digest('hex');
            console.log('🚀 ~ verifyEmailPasswordChange ~ hashedToken:', hashedToken);
            //Save Token to DB
            const saveTokenToDB = await new Token_1.default({
                userId: user._id,
                token: '',
                emailVerificationToken: '',
                phoneVerificationOTP: hashedToken,
                createdAt: Date.now(),
                expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
            }).save();
            if (!saveTokenToDB) {
                res.status(500);
                throw new Error('Internal server Error');
            }
            if (saveTokenToDB) {
                //Send Verification Email
                const message = `
    <h2>Hello, ${user.username}</h2>
    <p>A request for a sensitive change was made on your Belocated account. 
    To make sure you initiated this action, here is your verification code.</p>
    <p>The code is valid for 10minutes.</p>

    ${verificationToken}

    <p>Regards...</p>
    <p>Belocated Team</p>
    `;
                const subject = 'Verify Sensitive Change';
                const send_to = user.email;
                const reply_to = 'noreply@noreply.com';
                //Finally sending email
                const emailSent = await (0, sendEmail_1.default)(subject, message, send_to, reply_to);
                if (!emailSent) {
                    res.status(500).json('Password change verification failed');
                    throw new Error('Password change verification failed');
                }
                if (emailSent) {
                    const emailResponse = {
                        userId: user._id,
                        message: 'Verification OTP Sent',
                    };
                    res.status(200).json(emailResponse);
                }
            }
        }
    }
    catch (error) {
        console.log('🚀 ~ verifyEmailPasswordChange ~ error:', error);
    }
});
//>>>> Email Account Verification
exports.verifyUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { token } = req.params;
        //Hask token, then compare with token in db
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        //find token in db
        const userToken = await Token_1.default.findOne({
            emailVerificationToken: hashedToken,
            expiresAt: { $gt: Date.now() },
        });
        if (!userToken) {
            res.status(409).json({
                message: 'Invalid or Expired Token. The account is possibly already verified.',
            });
            return;
        }
        // find user
        const updatedUserDetails = await User_1.default.findByIdAndUpdate({ _id: userToken.userId }, {
            isEmailVerified: true,
        }, {
            new: true,
            runValidators: true,
        });
        if (!updatedUserDetails) {
            throw new Error('Failed to verify user');
        }
        if (updatedUserDetails) {
            // const updatedUser = await User.findById(userToken.userId)
            // Ref Bonus Update Stats
            if (updatedUserDetails === null || updatedUserDetails === void 0 ? void 0 : updatedUserDetails.referrersId) {
                //Getting referrer details from DB
                // console.log(updatedUserDetails.referrersId)
                // return
                const userRef = await User_1.default.findOne({
                    username: updatedUserDetails === null || updatedUserDetails === void 0 ? void 0 : updatedUserDetails.referrersId,
                });
                if (!userRef) {
                    throw new Error('Referrer does not exist');
                }
                const userRefWallet = await Wallet_1.default.findOne({ userId: userRef._id });
                if (!userRef) {
                    throw new Error('Referrer does not exist');
                }
                if (!userRefWallet) {
                    res.status(400).json({ message: 'Referrer wallet does not exist' });
                    throw new Error('Referrer wallet does not exist');
                }
                // Update referCount for userRef
                userRef.referralBonusPts += 1;
                const updatedUserRefCount = await userRef.save();
                //Pay Referrer his referral bonus
                userRefWallet.refBonWallet += 50;
                const referrer = await userRefWallet.save();
                if (!referrer || !updatedUserRefCount) {
                    throw new Error('Internal error with referral system from the server');
                }
                //Send Welcome Email
                const message = `
 <h2>Hello, ${userRef.username}</h2>
 <p>We are so happy to inform you that you've recieved 1 Point for referring a user to the Belocated platform.</p>
 <p>When your accumulated points get to the required threshold, they can be converted to money and added to your regular wallet for withdrawal via bank transfer or airtime, or you can use the funds to run a promotion on Belocated</p>

 <p>The threshold for referral bonus point conversion is 50 Points</p>

 <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>

 <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>

 <label>Link to Telegram group:</label>
 <a href="https://t.me/belocated">https://t.me/belocated<a/>
 <br/>

 <label>WhatsApp:</label>
 <a href="wa.me/2347031935276">wa.me/2347031935276<a/>
 <br/>

 <label>Email:</label>
 <p>cs@belocated.ng<p/>

 <p>Best Regards</p>
 <p>CEO BELOCATED</p>
 `;
                const subject = 'Congratulations, you Just Earned a Referral Point!';
                const send_to = userRef.email;
                const reply_to = 'noreply@noreply.com';
                //Finally sending email
                const emailSent = await (0, sendEmailApi_1.default)(subject, message, send_to, userRef.username);
                if (!emailSent) {
                    throw new Error('Failed to send referral bonus email');
                }
            }
            // Ref Challenge Update Stats
            if (updatedUserDetails === null || updatedUserDetails === void 0 ? void 0 : updatedUserDetails.refChallengeReferrersId) {
                //Getting referrer details from DB
                const userRef = await User_1.default.findOne({
                    username: updatedUserDetails === null || updatedUserDetails === void 0 ? void 0 : updatedUserDetails.refChallengeReferrersId,
                });
                if (!userRef) {
                    throw new Error('Referrer does not exist');
                }
                // If referrer does exist
                // Get all the referral challenges
                const pastChallenges = await RefChallenge_1.default.find();
                if (!pastChallenges) {
                    console.log('No challenges found');
                    // Send message to admin reporting that a user referred someone in the challenge when there's no challenge ongoing.
                }
                //Check if there's an onging referrer challenge
                //Update the referral challenge stats
                const hasOngoingChallenge = pastChallenges.find((pc) => pc.status === 'Ongoing');
                //If there's an ongoing challenge
                //Update the userRef referred User's array According to the ref challenge
                //If this field is not existing mongodb need to create it for that user.
                // userRef.referralChallengeReferredUsers.push(updatedUserDetails._id)
                userRef.referralChallengePts += 1;
                const referrer = await userRef.save();
                if (!hasOngoingChallenge) {
                    console.log("There's no ongoing challenge");
                    // Send email to admin notifying admin that there's no ongoing challenge and a user referred someone.
                }
                // Update the challenge
                if (hasOngoingChallenge) {
                    hasOngoingChallenge.totalRefUsers += 1;
                    hasOngoingChallenge.referralChallengeContestants.push(userRef._id);
                }
                const updatedRefChallenge = await (hasOngoingChallenge === null || hasOngoingChallenge === void 0 ? void 0 : hasOngoingChallenge.save());
                if (!updatedRefChallenge || !referrer) {
                    throw new Error('Internal error with referral system from the server');
                }
            }
            //Send Welcome Email
            const message = `
 <h2>Hello, ${updatedUserDetails.username}</h2>
 <p>We are so happy you are here because it means you believe in the brand and what it stands for.</p>
 <p>BeLocated was created just for you - giving you an opportuinity to publicize your brand on your terms and earn on your terms.</p>
 <p>It is definitely a win win with BeLocated.</p>

 <h3>How can I get started you might be wondering?</h3>

 <ul>
 <li>1. Once you are logged in, right on your dashboard you will see the icon earn and Advertise right under your wallet and available balance.</li>
 <li>2. Once you click earn or advertise, you will be required to verify your phone number and then fill out your profile details.</li>
 <li>3. Clicking the earn and advertise icon again after verifying your phone number and updating your profile, you will then gain access full access to earn and to advertise.</li>
 <li>4. When you click earn you are required to do two free task every week (the seven days of the week starts counting on a Sunday. You can see the free task countdown on your dash board) to gain access to the numerous paid task. Ensure you scroll through to scroll through all the listings until you see available tasks. Click on it to perform task. 
 </li>
 <li>5. You can only withdraw when you have an accumulation of 1000 naira (withdrawal as airtime) and 5000 (withdrawal as cash).
 </li>
 </ul>

 <h3>Advertise</h3>

 <ul>
 <li> When you click on the advertise icon, you will have access to a list of services on the different media platforms.</li>
 <li> You can advertise with your pending balance or fund your wallet to advertise.</li>
 </ul>

 <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>

 <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>

 <label>Link to Telegram group:</label>
 <a href="https://t.me/belocated">https://t.me/belocated<a/>
 <br/>

 <label>WhatsApp:</label>
 <a href="wa.me/2347031935276">wa.me/2347031935276<a/>
 <br/>

 <label>Email:</label>
 <p>cs@belocated.ng<p/>



 <p>Best Regards</p>
 <p>CEO BELOCATED</p>
 `;
            const subject = 'Welcome Note from the CEO';
            const send_to = updatedUserDetails.email;
            const reply_to = 'noreply@noreply.com';
            //Finally sending email
            const emailSent = await (0, sendEmailApi_1.default)(subject, message, send_to, updatedUserDetails.username);
            if (!emailSent) {
                res.status(500).json('Failed to send welcome email');
                throw new Error('Failed to send welcome email');
            }
            const { _id, isEmailVerified } = updatedUserDetails;
            res.status(200).json({ _id, isEmailVerified });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
});
//>>>> Email OTP Verification
exports.confirmEmailOTP = (0, express_async_handler_1.default)(async (req, res) => {
    const { OTP } = req.params;
    //Hask token, then compare with token in db
    const hashedToken = crypto_1.default.createHash('sha256').update(OTP).digest('hex');
    //find token in db
    const userOTP = await Token_1.default.findOne({
        phoneVerificationOTP: hashedToken,
        expiresAt: { $gt: Date.now() },
    });
    if (!userOTP) {
        res
            .status(404)
            .json({ message: 'Invalid or Expired OTP, request for another OTP' });
        throw new Error('Invalid or Expired OTP, request for another OTP');
    }
    if (userOTP) {
        // const updatedUser = await User.findById(userToken.userId)
        res.status(200).json('Verification Successful');
    }
});
//>>> Manage User
//  export const verifyUserPhone = asyncHandler( async(req: Request, res: Response) => {
//   const {phone} = req.body
//   const user = await User.findById(req.user._id)
//   const token = await Token.findOne({userId: req.user._id})
//   if (!user && !token) {
//     res.status(400);
//       throw new Error({message: "Authorization error"})
//   }
//   //const response =  await sendOTP(phone)
//  await sendVerification(phone)
//     //Save phone OTP
//     if (!token) {
//       res.status(500);
//       throw new Error({message: "Sending OTP failed"})
//     }
//     token.phoneVerificationOTP = Date.now(),
//     token.createdAt = Date.now(),
//     token.expiresAt = Date.now() + 30 * (60 * 1000) // Thirty minutes
//     //save the update on task model
//     const updatedToken = await token.save();
//     if (!updatedToken) {
//       res.status(500);
//           throw new Error("failed to send OTP")
//     }
//     if (updatedToken) {
//       res.status(200).json("OTP sent successfully")
//     }
//  })
//>>> Verify Phone
//   export const confirmUserPhone = asyncHandler(async (req: Request, res: Response) => {
//     const {phone, OTP} = req.body;
//     //Reset Phone verification status to false
//     // find user ancd change phone verification status to false
//     const resetUserPhoneVerifiedStatus = await User.findByIdAndUpdate(
//       { _id: req.user._id },
//       {
//         isPhoneVerified: false,
//       },
//       {
//           new: true,
//           runValidators: true
//       }
//   )
//       if (!resetUserPhoneVerifiedStatus) {
//         res.status(500);
//         throw new Error({message: "Server failed to complete verification process"})
//       }
//     //find user token
//     const token = await Token.findOne({userId: req.user._id})
//     if (!token) {
//       res.status(500);
//       throw new Error({message: "Verification failed"})
//     }
//     //const response = await verifyOTP(token.phoneVerificationOTP, OTP)
//     const response = await verifyOTP(phone, OTP)
//       //toggle user to verified
//       const user = await User.findById(req.user._id)
//       user.isPhoneVerified = true
//       //save toggle user to verified
//       const verifiedUser = await user.save();
//       if (!verifiedUser) {
//         res.status(500).json("Failed to verify user by phone");
//         throw new Error({message: "Failed to verify user by phone"});
//       }
//       if (verifiedUser) {
//       const {  _id,
//         fullname,
//         username,
//         email,
//         phone,
//         location,
//         community,
//         religion,
//         gender,
//         accountType,
//         bankName,
//         bankAccountNumber,
//         accountHolderName,
//         isEmailVerified,
//         isPhoneVerified,
//       taskCompleted,
//       taskOngoing,
//       adsCreated,
//       freeTaskCount,
//       walletId } = verifiedUser
//       res.status(200).json({  _id,
//         fullname,
//         username,
//         email,
//         phone,
//         location,
//         community,
//         religion,
//         gender,
//         accountType,
//         bankName,
//         bankAccountNumber,
//         accountHolderName,
//         isEmailVerified,
//         isPhoneVerified,
//       taskCompleted,
//       taskOngoing,
//       adsCreated,
//       freeTaskCount,
//       walletId,
//   })
//       }
// })
//>>> Delete User
exports.manageUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, status } = req.body;
    console.log(status);
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401);
        throw new Error('User not authorized to perform this action');
    }
    const user = await User_1.default.findById({ _id: userId });
    if (!user) {
        throw new Error('User does not exist');
    }
    if (status == 'Delete') {
        const delUser = await User_1.default.findByIdAndDelete(userId);
        if (!delUser) {
            res.status(500);
            throw new Error('Error deleting User');
        }
        res.status(200).json('User Deleted successfully');
    }
    user.accountStatus = status;
    const updatedStatus = await user.save();
    console.log(updatedStatus);
    if (!updatedStatus) {
        res.status(500);
        throw new Error('Error managing this User');
    }
    res.status(200).json('User management successful');
});
exports.sendReferralEmail = (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.body;
    console.log('🚀 ~ sendReferralEmail ~ email:', email);
    const referrerId = req.user._id;
    // Find the referrer
    const referrer = await User_1.default.findById(referrerId);
    if (!referrer) {
        res.status(404).json('Referrer not found');
        throw new Error('Referrer not found');
    }
    // Generate a referral token
    let referralToken = crypto_1.default.randomBytes(32).toString('hex') + referrer._id;
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(referralToken)
        .digest('hex');
    // Save the token in the database
    const saveTokenToDB = await new Token_1.default({
        userId: referrer._id,
        token: '',
        emailVerificationToken: '',
        referralToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // One week
    }).save();
    console.log('🚀 ~ sendReferralEmail ~ saveTokenToDB:', saveTokenToDB);
    if (!saveTokenToDB) {
        res.status(500);
        throw new Error('Internal server error');
    }
    // Construct the referral link
    const frontendUrl = process.env.FRONTEND_URL;
    const referralLink = `${frontendUrl}/?referralToken=${referralToken}`;
    // Construct the email content
    const message = `
        <h2>Hello,</h2>
        <p>${referrer.username} has invited you to join BeLocated!</p>
        <p>To get started, please click the link below to register:</p>
        <a href=${referralLink} clicktracking=off>${referralLink}</a>
        <p>This link is valid for one week.</p>
        <p>Regards,</p>
        <p>BeLocated Team</p>
    `;
    const subject = 'Join BeLocated - Referral Invitation';
    const send_to = email;
    const reply_to = 'noreply@noreply.com';
    // Send the referral email
    const response = await (0, sendEmailApi_1.default)(subject, message, send_to, reply_to);
    if (!response) {
        res.status(500).json('Failed to send referral email');
        throw new Error('Failed to send referral email');
    }
    if (referrer) {
        const referral = new Referral_1.default({
            referrerId: referrerId,
            referredUserId: null,
            referredEmail: email,
            pointsEarned: 0,
            status: 'Sent',
        });
        await referral.save();
    }
    res.status(200).json('Referral email sent successfully');
});
exports.getDashboardData = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user._id;
    const user = await User_1.default.findById(userId);
    const wallet = await Wallet_1.default.findOne({ userId: userId });
    const adverts = await Advert_1.default.find({ userId }).sort('-createdAt');
    const tasks = await Task_1.default.find({
        taskPerformerId: userId,
        status: 'Completed',
    }).sort('-createdAt');
    if (!user || !wallet) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    const totalEarnings = wallet.totalEarning;
    const myBalance = wallet.value;
    const advertsCreated = adverts.length;
    const tasksCompleted = tasks.length;
    const dashboardData = {
        totalEarnings: {
            value: totalEarnings,
            // growth: growthRate,
        },
        myBalance: {
            value: myBalance,
            // growth: growthRate,
        },
        advertsCreated: {
            value: advertsCreated,
            // growth: growthRate,
        },
        tasksCompleted: {
            value: tasksCompleted,
            // growth: growthRate,
        },
    };
    res.status(200).json(dashboardData);
});
//# sourceMappingURL=userController.js.map