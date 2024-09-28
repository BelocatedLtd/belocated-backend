"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trashFeed = exports.getFeed = exports.saveActivity = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Feed_1 = __importDefault(require("../model/Feed"));
// Save new Feed to DB
const saveActivity = async (data) => {
    const newActivity = await Feed_1.default.create({
        userId: data.userId,
        action: data.action,
    });
    if (!newActivity) {
        throw new Error('Failed to save new activity');
    }
    if (newActivity) {
        console.log('New activity saved!');
    }
};
exports.saveActivity = saveActivity;
exports.getFeed = (0, express_async_handler_1.default)(async (req, res) => {
    const activityFeed = await Feed_1.default.find().sort('-createdAt');
    if (!activityFeed) {
        res.status(400).json('failed to fetch activities');
        throw new Error('failed to fetch activities');
    }
    if (activityFeed) {
        res.status(200).json(activityFeed);
    }
});
exports.trashFeed = (0, express_async_handler_1.default)(async (req, res) => {
    const activityFeed = await Feed_1.default.deleteMany();
    if (!activityFeed) {
        res.status(400).json('failed to trash activities');
        throw new Error('failed to trash activities');
    }
    if (activityFeed) {
        res.status(200).json('Feed Emptied');
    }
});
//# sourceMappingURL=feedController.js.map