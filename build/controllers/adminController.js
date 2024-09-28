"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboard = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Advert_1 = __importDefault(require("../model/Advert"));
const Task_1 = __importDefault(require("../model/Task"));
const Transaction_1 = __importDefault(require("../model/Transaction"));
const User_1 = __importDefault(require("../model/User"));
exports.adminDashboard = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('🚀 ~ adminDashboard ~ userId:', req.user);
        // const user = await User.findById(userId)
        // if (!user) {
        // 	res.status(400).json({ message: 'User not found' })
        // }
        // const admins = await User.find({ accountType: 'Admin' })
        // if (!admins) {
        // 	res.status(400).json({ message: 'No admin found' })
        // }
        const totalUsers = await User_1.default.countDocuments();
        const totalAdverts = await Advert_1.default.countDocuments();
        const totalTasks = await Task_1.default.countDocuments();
        const totalTasksCompleted = await Task_1.default.countDocuments({
            status: 'Completed',
        });
        const totalTasksOngoing = await Task_1.default.countDocuments({ status: 'Ongoing' });
        const totalTasksCancelled = await Task_1.default.countDocuments({
            status: 'Cancelled',
        });
        const totalTasksPending = await Task_1.default.countDocuments({ status: 'Pending' });
        const totalTransactions = await Transaction_1.default.countDocuments();
        res.status(200).json({
            totalUsers,
            totalAdverts,
            totalTasks,
            totalTasksCompleted,
            totalTasksOngoing,
            totalTasksCancelled,
            totalTasksPending,
            totalTransactions,
        });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
//# sourceMappingURL=adminController.js.map