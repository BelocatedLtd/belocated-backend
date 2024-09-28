"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdvertById = exports.getTotalTasksByAllPlatforms = exports.getQualifiedAdverts = exports.deleteAdvert = exports.getAllAdvert = exports.getAdvert = exports.toggleAdvertFreeStatus = exports.initializeAdvert = exports.createAdvert = void 0;
const cloudinary_1 = require("cloudinary");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Advert_1 = __importDefault(require("../model/Advert"));
const Task_1 = __importDefault(require("../model/Task"));
const Transaction_1 = __importDefault(require("../model/Transaction"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
//Create New Advert
// http://localhost:6001/api/advert/create
exports.createAdvert = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, platform, service, adTitle, desiredROI, costPerTask, earnPerTask, gender, state, lga, caption, adAmount, socialPageLink, paymentMethod, paymentRef, } = req.body;
    // Validation
    if (!platform ||
        !service ||
        !adTitle ||
        !desiredROI ||
        !costPerTask ||
        !earnPerTask ||
        !gender ||
        !state ||
        !lga ||
        !adAmount ||
        !paymentMethod ||
        !paymentRef) {
        res
            .status(400)
            .json({ message: 'Please fill in all the required fields' });
        throw new Error('Please fill in all fields');
    }
    const admins = await User_1.default.find({ accountType: 'Admin' });
    if (!admins) {
        res.status(500).json({ message: 'No admin found' });
        throw new Error('No admin found');
    }
    try {
        // Getting user wallet
        const wallet = await Wallet_1.default.findOne({ userId: req.user._id });
        if (!wallet) {
            res.status(400).json({ message: 'Wallet not found' });
            throw new Error('Wallet not found');
        }
        // Checking if user wallet is sufficient to fund ad purchase
        if (wallet.value < adAmount) {
            res.status(400).json({
                message: 'Wallet insufficient to pay for ad, please fund wallet',
            });
            throw new Error('Wallet insufficient to pay for ad, please fund wallet');
        }
        //Cloudinary configuration
        // Return "https" URLs by setting secure: true
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        //Upload screenshots to databse
        let uploadedImages = [];
        if (req.files) {
            try {
                const files = Array.isArray(req.files)
                    ? req.files
                    : Object.values(req.files).flat();
                for (const file of files) {
                    const result = await cloudinary_1.v2.uploader.upload(file.path, {
                        resource_type: 'auto',
                        folder: 'Advert Media Contents',
                    });
                    uploadedImages.push({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error uploading images' });
            }
        }
        // Randomly pick an admin to moderate the tasks to be submitted for this advert.
        // Generate a random index within the range of the admins array length
        const randomIndex = Math.floor(Math.random() * admins.length);
        // Retrieve the admin object at the randomly generated index
        const selectedAdmin = admins[randomIndex];
        //After image has being uploaded to cloudinary - Now create advert
        //Create New Advert
        const advert = await Advert_1.default.create({
            userId,
            platform,
            service,
            adTitle,
            desiredROI,
            costPerTask,
            earnPerTask,
            gender,
            state,
            lga,
            caption,
            mediaURL: uploadedImages,
            adAmount,
            socialPageLink,
            tasksModerator: selectedAdmin.username,
            taskPerformers: [],
            tasks: 0,
            isFree: false,
            status: 'Pending Payment',
        });
        if (!advert) {
            res
                .status(400)
                .json({ message: 'Advert wasnt created, please try again' });
            throw new Error('Advert wasnt created, please try again');
        }
        //When wallet value is sufficient and advert has being created, then you can go ahead and make payment
        if (wallet.value >= adAmount && advert) {
            // Update user wallet after payment made
            //Debit user main wallet
            const updatedUserWallet = await Wallet_1.default.updateOne({ userId: req.user._id }, {
                $inc: { value: -adAmount },
            }, {
                new: true,
                runValidators: true,
            });
            //Increase value of amount spent by user
            const updateAmountSpent = await Wallet_1.default.updateOne({ userId: req.user._id }, {
                $inc: { amountSpent: adAmount },
            }, {
                new: true,
                runValidators: true,
            });
            if (!updatedUserWallet || !updateAmountSpent) {
                res
                    .status(400)
                    .json({ message: 'Cannot access user wallet to make ad payment' });
                throw new Error('Cannot access user wallet to make ad payment');
            }
            if (updatedUserWallet && updateAmountSpent) {
                // Change Advert Status to Running && Create Transaction
                //Change advert status
                const updateAdStatus = await Advert_1.default.updateOne({ _id: advert._id }, {
                    status: 'Running',
                }, {
                    new: true,
                    runValidators: true,
                });
                if (!updateAdStatus) {
                    res
                        .status(400)
                        .json({ message: 'Failed to switch ad status to running' });
                    throw new Error('Failed to switch ad status to running');
                }
                //Create new transaction
                if (updateAdStatus) {
                    //Create New Transaction
                    const transaction = await Transaction_1.default.create({
                        userId,
                        email: req.user.email,
                        date: Date.now(),
                        chargedAmount: adAmount,
                        trxId: `ad_p${advert._id}`,
                        paymentRef,
                        trxType: 'Ad Payment',
                        status: 'Approved Successful',
                        paymentMethod,
                    });
                    if (!transaction) {
                        res.status(400).json({ message: 'Failed to create transaction' });
                        throw new Error('Failed to create transaction');
                    }
                    if (advert && transaction) {
                        res.status(201).json(advert);
                    }
                }
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
exports.initializeAdvert = (0, express_async_handler_1.default)(async (req, res) => {
    console.log('🚀 ~ initializeAdvert ~ initializeAdvert:', exports.initializeAdvert);
    try {
        const { userId, platform, service, adTitle, desiredROI, costPerTask, earnPerTask, gender, state, lga, caption, adAmount, socialPageLink, paymentRef, } = req.body;
        // Validation
        if (!platform ||
            !service ||
            !adTitle ||
            !desiredROI ||
            !costPerTask ||
            !earnPerTask ||
            !gender ||
            !state ||
            !lga ||
            !adAmount ||
            !paymentRef) {
            res
                .status(400)
                .json({ message: 'Please fill in all the required fields' });
            throw new Error('Please fill in all fields');
        }
        const existingAdvert = await Advert_1.default.findOne({ paymentRef });
        if (existingAdvert) {
            res.status(400).json({
                message: 'An advert with this payment reference already exists!',
            });
            return;
        }
        const admins = await User_1.default.find({ accountType: 'Admin' });
        if (!admins) {
            res.status(500).json({ message: 'No admin found' });
            throw new Error('No admin found');
        }
        // Randomly pick an admin to moderate the tasks to be submitted for this advert.
        const randomIndex = Math.floor(Math.random() * admins.length);
        const selectedAdmin = admins[randomIndex];
        console.log('🚀 ~ initializeAdvert ~ selectedAdmin:', selectedAdmin);
        //Cloudinary configuration
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        // Upload screenshots to database
        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log('🚀 ~ initializeAdvert ~ files:', req.files);
            try {
                for (const file of req.files) {
                    const result = await cloudinary_1.v2.uploader.upload(file.path, {
                        resource_type: 'auto',
                        folder: 'Advert Media Contents',
                    });
                    uploadedImages.push({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error uploading images' });
                throw new Error('Error uploading images');
            }
        }
        // Create New Advert
        const advert = await Advert_1.default.create({
            userId,
            platform,
            service,
            adTitle,
            desiredROI,
            costPerTask,
            earnPerTask,
            gender,
            state,
            lga,
            caption,
            mediaURL: uploadedImages,
            adAmount,
            socialPageLink,
            tasksModerator: selectedAdmin.username,
            taskPerformers: [],
            tasks: 0,
            isFree: false,
            status: 'Pending Payment',
            paymentRef,
        });
        console.log('🚀 ~ initializeAdvert ~ advert:', advert);
        if (!advert) {
            res
                .status(400)
                .json({ message: `Advert wasn't created, please try again` });
            throw new Error("Advert wasn't created, please try again");
        }
        res.status(200).json(advert);
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
//Change Advert Free Status
// http://localhost:6001/api/advert/create
exports.toggleAdvertFreeStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { advertId } = req.body;
    const advert = await Advert_1.default.findById(req.params.id);
    const user = await User_1.default.findById(req.user._id);
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res.status(401).json({ message: 'Unauthorized User' });
        throw new Error('Unauthorized User');
    }
    if (!advert) {
        res.status(404).json({ message: 'Cannot find advert' });
        throw new Error('Failed to find Advert');
    }
    if (advert.isFree === false) {
        advert.isFree = true;
        const toggleAdTypeFalseToTrue = advert.save();
        if (!toggleAdTypeFalseToTrue) {
            res.status(404).json({ message: 'Failed to change advert type' });
            throw new Error();
        }
        res.status(200).json(toggleAdTypeFalseToTrue);
        return;
    }
    if (advert.isFree === true) {
        advert.isFree = false;
        const toggleAdTypeTrueToFalse = advert.save();
        if (!toggleAdTypeTrueToFalse) {
            res.status(404).json({ message: 'Failed to change advert type' });
            throw new Error();
        }
        res.status(200).json(toggleAdTypeTrueToFalse);
        return;
    }
});
//Get user Advert
// http://localhost:6001/api/advert
exports.getAdvert = (0, express_async_handler_1.default)(async (req, res) => {
    //const { userId } = req.body
    const { _id } = req.user;
    try {
        const adverts = await Advert_1.default.find({ userId: _id }).sort('-createdAt');
        if (!adverts) {
            res.status(400).json({ mesage: 'Cannot find any ad for this user' });
            throw new Error('Cannot find any ad for this user');
        }
        if (adverts) {
            res.status(200).json(adverts);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// Get All Advert
// http://localhost:6001/api/advert/all
exports.getAllAdvert = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Get page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        let adverts;
        if (!page && !limit) {
            adverts = await Advert_1.default.find()
                .sort('-createdAt')
                .populate('userId', 'fullname email');
        }
        else {
            const currentPage = page || 1;
            const currentLimit = limit || 10;
            const startIndex = (currentPage - 1) * currentLimit;
            const totalAdverts = await Advert_1.default.countDocuments();
            adverts = await Advert_1.default.find()
                .sort('-createdAt')
                .skip(startIndex)
                .limit(currentLimit)
                .populate('userId', 'fullname email');
            const totalPages = Math.ceil(totalAdverts / currentLimit);
            res.status(200).json({
                adverts,
                page: currentPage,
                totalPages,
                totalAdverts,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            });
        }
        if (!adverts || adverts.length === 0) {
            throw new Error('No advert found in the database');
        }
        res.status(200).json({
            adverts,
            totalAdverts: adverts.length, // or total number of adverts if paginated
        });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//>>> Delete Advert
exports.deleteAdvert = (0, express_async_handler_1.default)(async (req, res) => {
    const { advertId } = req.params;
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res
            .status(401)
            .json({ message: 'User not authorized to perform this action' });
        throw new Error('User not authorized to perform this action');
    }
    const advert = await Advert_1.default.findById({ _id: advertId });
    if (!advert) {
        res
            .status(400)
            .json({ message: 'Advert does not exist or already deleted' });
        throw new Error('Advert does not exist or already deleted');
    }
    const delAdvert = await Advert_1.default.findByIdAndDelete(advertId);
    if (!delAdvert) {
        res.status(500).json({ message: 'Error Deleting Advert' });
        throw new Error('Error Deleting Advert');
    }
    res.status(200).json('Advert Deleted successfully');
});
exports.getQualifiedAdverts = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id, location, community, gender } = req.user;
    const { platformName } = req.params;
    try {
        // Fetch all adverts for the specified platform, sorted by creation date in descending order
        const adverts = await Advert_1.default.find({
            platform: platformName,
            status: 'Running',
        }).sort('-createdAt');
        console.log('🚀 ~ getQualifiedAdverts ~ adverts:', adverts.length);
        if (!adverts.length) {
            throw new Error('No adverts found');
        }
        // Retrieve tasks associated with the user
        const userTasks = await Task_1.default.find({ taskPerformerId: _id }).select('advertId');
        console.log('🚀 ~ getQualifiedAdverts ~ userTasks:', userTasks.length);
        const userTaskAdvertIds = userTasks.map((task) => { var _a; return ((_a = task.advertId) === null || _a === void 0 ? void 0 : _a.toString()) || ''; });
        // Group adverts by service type
        const advertsByServiceType = {};
        adverts.forEach((advert) => {
            const serviceType = advert.service || 'Undefined'; // Handle undefined serviceType
            if (!advertsByServiceType[serviceType]) {
                advertsByServiceType[serviceType] = { adverts: [], count: 0 };
            }
            advertsByServiceType[serviceType].adverts.push(advert);
            advertsByServiceType[serviceType].count++;
        });
        // Filter and select one advert per service type
        const selectedAdverts = [];
        for (const serviceType in advertsByServiceType) {
            const { adverts: serviceAdverts } = advertsByServiceType[serviceType];
            const filteredAdverts = serviceAdverts.filter((advert) => {
                const locationMatch = advert.state === location || advert.state === 'All';
                const communityMatch = advert.lga === community || advert.lga === 'All';
                const genderMatch = advert.gender === gender || advert.gender === 'All';
                const notAlreadyTasked = !userTaskAdvertIds.includes(advert._id.toString());
                return (locationMatch && communityMatch && genderMatch && notAlreadyTasked);
            });
            if (filteredAdverts.length > 0) {
                const filteredAdvert = filteredAdverts[0];
                selectedAdverts.push({
                    ...filteredAdvert._doc,
                    availableTasks: filteredAdverts.length, // Count only the filtered adverts
                });
            }
        }
        // Respond with the selected adverts including the task counts
        res.status(200).json(selectedAdverts);
    }
    catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({ error });
    }
});
exports.getTotalTasksByAllPlatforms = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id, location, community, gender } = req.user;
    try {
        const eligibleAdverts = await Advert_1.default.find({
            status: 'Running',
            $and: [
                {
                    $or: [{ state: location }, { state: 'All' }],
                },
                {
                    $or: [{ lga: community }, { lga: 'All' }],
                },
                {
                    $or: [{ gender: gender }, { gender: 'All' }],
                },
            ],
        }).sort('-createdAt');
        if (!eligibleAdverts.length) {
            res.status(200).json(null);
            return;
        }
        const userTasks = await Task_1.default.find({ taskPerformerId: _id }).select('advertId');
        const userTaskAdvertIds = new Set(userTasks.map((task) => { var _a; return ((_a = task.advertId) === null || _a === void 0 ? void 0 : _a.toString()) || ''; }));
        const platformTaskCounts = {};
        eligibleAdverts.forEach((advert) => {
            if (!userTaskAdvertIds.has(advert._id.toString())) {
                const platformName = advert.platform;
                if (!platformTaskCounts[platformName]) {
                    platformTaskCounts[platformName] = { totalTasks: 0 };
                }
                platformTaskCounts[platformName].totalTasks++;
            }
        });
        res.status(200).json(platformTaskCounts);
    }
    catch (error) {
        res.status(500).json({ error: error || 'Internal Server Error' });
    }
});
// get advert by id
exports.getAdvertById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    try {
        const advert = await Advert_1.default.findById({ _id: id }).populate('userId');
        if (!advert) {
            res.status(400).json({ message: 'Advert not found' });
            return;
        }
        res.status(200).json(advert);
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//# sourceMappingURL=advertController.js.map