import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import RefChallenge from "../model/RefChallenge.js";


  //Get All Ongoing Challenge
 // http://localhost:6001/api/ref/challenge/
 export const  getOngoingRefChallenge = asyncHandler(async (req, res) => {

        //const ongoingChallenge = await RefChallenge.findOne({status: "Ongoing"})
        const challenges = await RefChallenge.find()
        
       if(!challenges ) {
           res.status(400).json({ message: "No referral challenge found" })
       } 
       
       const ongoingChallenge = challenges.find(ch => ch.status === "Ongoing")
        
       if (!ongoingChallenge) {
        res.status(400).json({ message: "No ongoing challenge found" })
       }

        res.status(200).json(ongoingChallenge)
  })

  //Get All Referral Challenge
 // http://localhost:6001/api/tasks
export const  getAllRefChallenges = asyncHandler(async (req, res) => {
    const { _id } = req.user

    if (req.user.accountType !== "Admin" || req.user.accountType !== "Super Admin") {
        res.status(401).json({message:"Not Authorized"})
        throw new Error("Not authorized")
    }

    if (req.user.accountType === "Admin" || req.user.accountType === "Super Admin") {
        let challenges;

        challenges = await RefChallenge.find().sort("-createdAt")

        if(!challenges) {
            res.status(400).json({message: "Cannot find any referral challenge"})
            throw new error("Cannot find any referral challen")
        } 

        if (challenges) {
            res.status(200).json(challenges)
         }
    }
  })


      /*  CONVERT REF BONUS TO WALLLET FUNDS */
// http://localhost:6001/api/transactions/all
export const  convertRefBonusPts = asyncHandler(async(req, res) => {


    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findOne({userId: req.user._id})

    //
    wallet.value += user.referralBonusPts

    const updatedWallet = wallet.save()

    if (!updatedWallet) {
        res.status(501).json("Ref bonus points failed to convert")
    }

    user.referralBonusPts = 0

    const updatedUser = user.save()

    if (!updatedUser) {
        res.status(501).json("Failed to reset user ref bonus point")
    }

    res.status(200).json("Ref bonus points successfully converted")
  })