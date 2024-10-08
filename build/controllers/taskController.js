"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.rejectTask = exports.approveTask = exports.submitTask = exports.getTasks = exports.getTaskById = exports.getTask = exports.CreateNewTask = void 0;
const cloudinary_1 = require("cloudinary");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Advert_1 = __importDefault(require("../model/Advert"));
const Task_1 = __importDefault(require("../model/Task"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
// import cloudinary from "../utils/cloudinary";
//import { fileSizeFormatter } from "../utils/fileUpload";
//import {uploadMultipleImages} from '../utils/cloudinary'
//Create New Task
// http://localhost:6001/api/tasks/create
exports.CreateNewTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { advertId, advertiserId, taskPerformerId, title, platform, service, desiredROI, toEarn, gender, state, lga, caption, taskVerification, socialPageLink, adMedia, } = req.body;
    const advert = await Advert_1.default.findById(advertId);
    if (!advert) {
        res
            .status(404)
            .json({ message: 'The advert for this task could not be found' });
        throw new Error('The advert for this task could not be found');
    }
    //Create New Task
    const task = await Task_1.default.create({
        advertId,
        advertiserId,
        taskPerformerId,
        title,
        platform,
        service,
        desiredROI,
        toEarn,
        gender,
        state,
        lga,
        caption,
        taskVerification,
        socialPageLink,
        proofOfWorkMediaURL: {
            public_id: '',
            url: '',
        },
        nameOnSocialPlatform: '',
        adMedia,
        status: 'Awaiting Submission',
    });
    if (!task) {
        res
            .status(500)
            .json({ message: 'Failed to add user to perform this task' });
        throw new Error('Failed to add user to perform this task');
    }
    if (task) {
        res.status(201).json(task);
    }
});
//Get user Task
// http://localhost:6001/api/tasks/task
exports.getTask = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const tasks = await Task_1.default.find({
            taskPerformerId: req.user._id,
        })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const totalTasks = await Task_1.default.countDocuments({
            taskPerformerId: req.user._id,
        });
        const totalPages = Math.ceil(totalTasks / Number(limit));
        if (!tasks || tasks.length === 0) {
            res.status(400).json({ message: 'Cannot find task' });
            return;
        }
        res.status(200).json({
            tasks,
            totalTasks,
            totalPages,
            currentPage: Number(page),
        });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.getTaskById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    try {
        const tasks = await Task_1.default.findById({ _id: id }).populate('advertId');
        if (!tasks) {
            res.status(400).json({ message: 'Cannot find task' });
            throw new Error('Cannot find task');
        }
        const taskWithRenamedAdvert = {
            ...tasks.toObject(),
            advert: tasks.advertId,
        };
        // Remove the original advert field if necessary
        delete taskWithRenamedAdvert.advertId;
        res.status(200).json(taskWithRenamedAdvert);
        if (tasks) {
            res.status(200).json(tasks);
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
//Get user Tasks
// http://localhost:6001/api/tasks
exports.getTasks = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id } = req.user;
    let tasks;
    if (req.user.accountType !== 'Admin') {
        tasks = await Task_1.default.find({ taskPerformerId: _id }).sort('-createdAt');
    }
    if (req.user.accountType === 'Admin') {
        tasks = await Task_1.default.find().sort('-createdAt');
        if (!tasks) {
            res.status(400).json({ message: 'Cannot find any task' });
            throw new Error('Cannot find any task');
        }
    }
    if (tasks) {
        res.status(200).json(tasks);
    }
});
// Submit Task
// http://localhost:6001/api/tasks/submit
exports.submitTask = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { taskId, userSocialName } = req.body;
        // Gets details about the task submitted, advert for the task, user or task performer, and user wallet.
        const task = await Task_1.default.findById(taskId);
        if (!task) {
            throw new Error('Cannot find task');
        }
        const advert = await Advert_1.default.findById(task.advertId);
        if (!advert) {
            throw new Error('Cannot find advert');
        }
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            throw new Error('Cannot find user');
        }
        const wallet = await Wallet_1.default.findOne({ userId: req.user._id });
        if (!wallet) {
            throw new Error('Cannot find user Wallet to update');
        }
        // If ad campaign is no longer active
        if (advert.desiredROI === 0) {
            throw new Error('Ad campaign is no longer active');
        }
        // If the task has already been submitted
        if (task.status === 'Submitted') {
            throw new Error('You have submitted your task, you can only submit once, please wait for approval');
        }
        // Cloudinary configuration
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        // Upload screenshots if provided
        let uploadedImages = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const result = await cloudinary_1.v2.uploader.upload(file.path, {
                    folder: 'Task Submit Screenshots',
                });
                uploadedImages.push({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        }
        // Update task with submission details
        const updatedTask = await Task_1.default.findByIdAndUpdate(taskId, {
            nameOnSocialPlatform: userSocialName || task.nameOnSocialPlatform,
            proofOfWorkMediaURL: uploadedImages,
            status: 'Submitted',
        }, { new: true, runValidators: true });
        // Calculate start of the current week (Sunday 12pm)
        const startOfWeek = new Date();
        startOfWeek.setHours(12, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        // Count approved tasks for the current week
        const approvedTasksThisWeek = await Task_1.default.countDocuments({
            taskPerformerId: req.user._id,
            status: 'Approved',
            createdAt: { $gte: startOfWeek, $lte: new Date() },
        });
        // Determine if this task should be free (4th or 9th task of the week)
        let isFreeTask = false;
        if ([4, 9].includes(approvedTasksThisWeek + 1)) {
            // Check if user has already completed their two free tasks for the week
            const freeTasksThisWeek = await Task_1.default.countDocuments({
                taskPerformerId: req.user._id,
                isFreeTask: true,
                status: 'Approved',
                createdAt: { $gte: startOfWeek, $lte: new Date() },
            });
            // Only mark it as free if the user has not done two free tasks yet
            if (freeTasksThisWeek < 2) {
                isFreeTask = true;
            }
        }
        // Handle task submission based on whether it’s free or paid
        if (isFreeTask) {
            // Mark task as free
            await Task_1.default.findByIdAndUpdate(taskId, { isFreeTask: true }, { new: true });
            // Subtract one free task count from the user
            user.freeTaskCount -= 1;
            await user.save();
            // Respond with success for free task
            res
                .status(200)
                .json("Task submitted as a free task, wait for Admin's Approval");
        }
        else {
            // For paid task, add the earning to the user's pending balance
            const updatedUserWallet = await Wallet_1.default.updateOne({ userId: req.user._id }, { $inc: { pendingBalance: task.toEarn } });
            if (!updatedUserWallet) {
                throw new Error('Failed to update user pending balance');
            }
            // Respond with success for paid task
            res
                .status(200)
                .json("Task submitted successfully, wait for Admin's Approval");
        }
        // Decrease advert's desired ROI and increment the task count
        advert.desiredROI -= 1;
        advert.tasks += 1;
        // Save the updated advert
        const updatedAdvert = await advert.save();
        if (!updatedAdvert) {
            throw new Error('Failed to update advert');
        }
        // Mark advert as "Completed" if desired ROI is 0
        if (advert.desiredROI === 0) {
            advert.status = 'Completed';
            await advert.save();
        }
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
// Admin Approve Submitted Tasks and Pay user
exports.approveTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { taskId, status, message } = req.body;
    const task = await Task_1.default.findById(taskId);
    if (!task) {
        throw new Error('Cannot find task');
    }
    const userIdString = req.user._id.toString();
    //Check if user is an admin
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin' &&
        userIdString !== task.advertiserId) {
        throw new Error('User Not Authorized');
    }
    //const task = await Task.findById(taskId)
    const advert = await Advert_1.default.findById(task === null || task === void 0 ? void 0 : task.advertId);
    const taskPerformer = await User_1.default.findById(task === null || task === void 0 ? void 0 : task.taskPerformerId);
    const wallet = await Wallet_1.default.findOne({ userId: task === null || task === void 0 ? void 0 : task.taskPerformerId });
    const advertiser = await User_1.default.findById(task.advertiserId);
    const advertserWallet = await Wallet_1.default.findOne({ userId: task === null || task === void 0 ? void 0 : task.advertiserId });
    if (!task) {
        throw new Error('Cannot find task');
    }
    if (task.status === 'Approved') {
        throw new Error('This task has already being approved, you can only be paid once for an approved Task, please perform another task');
    }
    if (!wallet) {
        throw new Error('Cannot find user Wallet for payment');
    }
    if (!taskPerformer) {
        throw new Error('Cannot find task performer details');
    }
    if (!advertserWallet) {
        throw new Error('Cannot find user Wallet Advertisers for payment retrieval');
    }
    if (!advertiser) {
        throw new Error('Cannot find Advertiser');
    }
    if (!advert) {
        throw new Error('Cannot find the ad for this task');
    }
    // Check if admin is the moderator asigned to the advert for this task
    //Check if user is an admin
    // if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
    //     res.status(400).json({message: "You are not assigned to moderate this task"});
    //     throw new Error("You are not assigned to moderate this task")
    // }
    if (advert.desiredROI === 0) {
        throw new Error('Ad campaign is no longer running');
    }
    let updatedTask;
    if (status === 'Partial Approval') {
        //Update task status after user submit screenshot
        task.status = status;
        task.message = message;
        //save the update on task model
        updatedTask = await task.save();
    }
    if (status === 'Approved') {
        //Update task status after user submit screenshot
        task.status = 'Approved';
        //save the update on task model
        updatedTask = await task.save();
    }
    if (!updatedTask) {
        throw new Error('Failed to approve task');
    }
    // When advert is a paid advert. Payment should be approved
    if (advert.isFree === false) {
        // Update Task performer's Wallets
        wallet.pendingBalance -= task.toEarn;
        wallet.value += task.toEarn;
        wallet.totalEarning += task.toEarn;
        //save the update on user wallet
        const updatedTaskPerformerWallet = await wallet.save();
        if (!updatedTaskPerformerWallet) {
            throw new Error('Failed to update user wallet');
        }
    }
    // When advert is free
    // User freetask count should be subtracted by 1 and if its zero, an email should be sent.
    if (advert.isFree === true) {
        //User has completed the free task count for the week - Send email to the user
        if (taskPerformer.freeTaskCount === 0 && status === 'Approved') {
            //Send Free Task Completed Email
            const message = `
            <h2>Congratulations ${taskPerformer === null || taskPerformer === void 0 ? void 0 : taskPerformer.username}!</h2>
            <p>You have successfully completed your two free task for the week</p>
            <p>Kindly return to your dashboard, refresh and click on earn to access paid tasks for this week.</p>
            <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>
            <label>Link to Telegram group:</label><a href="https://t.me/beloacted">https://t.me/beloacted</a>
            <label>WhatsApp:</label><a href="https://wa.me/2347031935276">https://wa.me/2347031935276</a>
            <label>Email:</label><p>cs@belocated.ng</p>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `;
            const subject = 'Free Task Completed!';
            const send_to = taskPerformer === null || taskPerformer === void 0 ? void 0 : taskPerformer.email;
            const reply_to = 'noreply@noreply.com';
            //Finally sending email
            const emailSent = await (0, sendEmail_1.default)(subject, message, send_to, reply_to);
            if (!emailSent) {
                res.status(500).json('Email sending failed');
                throw new Error('Email sending failed');
            }
        }
    }
    //Update the list of taskperformers.
    advert.taskPerformers.push(taskPerformer._id);
    await advert.save();
    res.status(200).json(updatedTask);
});
// Admin Reject Submitted Tasks and Pay user
exports.rejectTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { taskId, message } = req.body;
    //Check if user is an admin
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        throw new Error('User Not Authorized');
    }
    const task = await Task_1.default.findById(taskId);
    if (!task) {
        throw new Error('Cannot find task');
    }
    const advert = await Advert_1.default.findById(task.advertId);
    const wallet = await Wallet_1.default.findOne({ userId: task.taskPerformerId });
    const taskPerformer = await User_1.default.findById(task.taskPerformerId);
    const advertserWallet = await Wallet_1.default.find({ userId: task.advertiserId });
    if (!task) {
        throw new Error('Cannot find task');
    }
    if (task.status === 'Rejected') {
        throw new Error('This task has already being rejected, read the admins message and follow the instructions');
    }
    if (task.status === 'Approved') {
        throw new Error('This task has already being approved, to avoid double payments and confusion to the system, you cant reject and already approved task. Contact Admin');
    }
    if (!wallet) {
        throw new Error('Cannot find user Wallet');
    }
    if (!taskPerformer) {
        throw new Error('Cannot find task performer details');
    }
    if (!advertserWallet) {
        throw new Error('Cannot find user Wallet Advertisers for payment retrieval');
    }
    if (!advert) {
        throw new Error('Cannot find user Wallet to update');
    }
    // Check if admin is the moderator asigned to the advert for this task
    //Check if user is an admin
    if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
        throw new Error('You are not assigned to moderate this task');
    }
    if (advert.desiredROI === 0) {
        throw new Error('Ad campaign is no longer active');
    }
    //Update task status after user submit screenshot
    task.status = 'Rejected';
    task.message = message;
    //save the update on task model
    const updatedTask = await task.save();
    if (!updatedTask) {
        throw new Error('Failed to approve task');
    }
    if (advert.isFree === true) {
        taskPerformer.freeTaskCount += 1;
        //save the update on user model
        const addFreeTaskCount = await taskPerformer.save();
        if (!addFreeTaskCount) {
            throw new Error('Failed to return rejected free task count');
        }
    }
    // Subtract Task performer's Wallets
    // Update the pendingBalance
    wallet.pendingBalance -= task.toEarn;
    //save subtracted user wallet
    const walletSubUpdate = await wallet.save();
    if (!walletSubUpdate) {
        res
            .status(500)
            .json({ message: 'Failed to subtract user pending balance wallet' });
        throw new Error('Failed to update user wallet');
    }
    // Whether free task or paid task
    // desiredROI for the advert should be added back by 1, ad status should be changed to Running
    //Add 1 back to the desired roi
    //Subtract the number of tasks completed on an advert
    advert.desiredROI += 1;
    advert.tasks -= 1;
    advert.status = 'Running';
    //save the update on user model
    const updatedAdvert = await advert.save();
    if (!updatedAdvert) {
        throw new Error('Failed to failed task');
    }
    res.status(400).json(task);
});
//>>> Delete Task
exports.deleteTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { taskId } = req.params;
    if (req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin') {
        res
            .status(401)
            .json({ message: 'User not authorized to perform this action' });
        throw new Error('User not authorized to perform this action');
    }
    const task = await Task_1.default.findById({ _id: taskId });
    if (!task) {
        res.status(400).json('Task does not exist or already deleted');
    }
    const delTask = await Task_1.default.findByIdAndDelete(taskId);
    if (!delTask) {
        res.status(500).json({ message: 'Error Deleting Task' });
        throw new Error('Error Deleting Task');
    }
    res.status(200).json('Task Deleted successfully');
});
//# sourceMappingURL=taskController.js.map