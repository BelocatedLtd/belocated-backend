import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from '../model/Advert.js'
import Transaction from "../model/Transaction.js";
import Feed from "../model/Feed.js";

// Save new Feed to DB
export const saveActivity = asyncHandler(async(data) => {

    const newActivity = await Feed.create({
        userId: data.userId,
        action: data.action,
    });

    if (!newActivity) {
        throw new Error({message: "Failed to save new activity"})
    }

    if (newActivity) {
        console.log("New activity saved!")
    }
})

export const getFeed = asyncHandler(async(req, res) => {
    const activityFeed = await Feed.find().sort("-createdAt")

    if(!activityFeed) {
        res.status(400).json("failed to fetch activities")
        throw new error({message: "failed to fetch activities"})
    } 

    if (activityFeed) {
        res.status(200).json(activityFeed)
     }
})

export const trashFeed = asyncHandler(async(req, res) => {

    const activityFeed = await Feed.deleteMany()

    if(!activityFeed) {
        res.status(400).json("failed to trash activities")
        throw new error({message: "failed to trash activities"})
    } 

    if (activityFeed) {
        res.status(200).json('Feed Emptied')
     }
})