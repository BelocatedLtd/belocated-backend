import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from '../model/Advert.js'
import Transaction from "../model/Transaction.js";

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