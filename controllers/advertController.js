import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import Advert from '../model/Advert.js'
import Transaction from "../model/Transaction.js";
import { v2 as cloudinary } from 'cloudinary'


//Create New Advert
// http://localhost:6001/api/advert/create
export const createAdvert = asyncHandler(async (req, res) => {
    const { userId, platform, service, desiredROI, costPerTask, earnPerTask, gender, state, lga, religion, caption, mediaURL, adAmount, socialPageLink } = req.body;

         // Validation
         if ( !platform || !service || !desiredROI || !costPerTask || !earnPerTask || !gender || !state || !lga || !adAmount ) {
            res.status(400).json('Please fill in all the required fields');
            throw new Error("Please fill in all fields")
         }

         try {
            // Getting user wallet
            const wallet = await Wallet.findOne({userId: req.user._id})
            if (!wallet) {
                res.status(400).json({msg: "Wallet not found"})
                throw new Error("Wallet not found")
            }
    
           // Match existing wallet to the loggedin user 
            if (wallet.userId !== userId && userId !== req.user._id) {
                res.status(401).json("User not authorized to make this transaction")
                throw new Error("User not authorized to make this transaction") 
            }
    
            // Checking if user wallet is sufficient to fund ad purchase
            if (wallet.value < adAmount) {
                res.status(400).json({msg: "Wallet insufficient to pay for ad, please fund wallet"})
                throw new Error("Wallet insufficient to pay for ad, please fund wallet") 
            }


             //Upload Media to Cloudinary
            //  cloudinary.config({
            //     cloud_name: process.env.CLOUDINARY_NAME,
            //     api_key: process.env.CLOUDINARY_API_KEY,
            //     api_secret: process.env.CLOUDINARY_API_SECRET
            // });

            let fileData = {}
            // let result;

            // if (req.file) {
            //     try {
            //         result = await cloudinary.uploader.upload(req.file.path, {
            //             folder: "Belocated Ad Media"
            //         })            
            //     } catch (error) {
            //         res.status(500)
            //             throw new Error("Image could not be uploaded")
            //     }

            //     fileData = {
            //         fileName: req.file.originalname,
            //         filePath: result.secure_url,
            //         fileType: req.file.mimetype,
            //         fileSize: req.file.size
            //     };
            // }


            //After image has being uploaded to cloudinary - Now create advert
            
                //Create New Advert
               const  advert = await Advert.create({
                userId, 
                platform, 
                service, 
                desiredROI, 
                costPerTask,
                earnPerTask,
                gender, 
                state,
                lga,
                caption, 
                mediaURL: fileData,
                adAmount,
                socialPageLink,
                tasks: 0,
                status: "Pending Payment" //Pending Payment, Running, Allocating, Allocated, Completed
            });
            
            if (!advert) {
                res.status(400).json({msg: "Advert wasnt created, please try again"});
                    throw new Error("Advert wasnt created, please try again")
            }

            //When wallet value is sufficient and advert has being created, then you can go ahead and make payment
            if (wallet.value >= adAmount && advert) {
                // Update user wallet after payment made 
                
                //Debit user main wallet
                const updatedUserWallet = await Wallet.updateOne(
                    { userId:  req.user._id},
                    {
                        $inc: {value: -adAmount}
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )

                //Increase value of amount spent by user
                const updateAmountSpent = await Wallet.updateOne(
                    { userId:  req.user._id},
                    {
                        $inc: {amountSpent: adAmount}
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )

            if (!updatedUserWallet || !updateAmountSpent) {
                res.status(400).json("Cannot access user wallet to make ad payment")
                throw new Error("Cannot access user wallet to make ad payment")
            }

            if (updatedUserWallet && updateAmountSpent) {
                // Change Advert Status to Running && Create Transaction 

                //Change advert status
                const updateAdStatus = await Advert.updateOne(
                    { _id:  advert._id},
                    {
                        status: "Running"
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )

                if (!updateAdStatus) {
                    res.status(400).json("Failed to switch ad status to running")
                    throw new Error("Failed to switch ad status to running")
                }

                //Create new transaction
                if (updateAdStatus) {

                    //Create New Transaction
                    const transaction = await Transaction.create({
                        userId, 
                        email: req.user.email, 
                        date: Date.now(), 
                        chargedAmount: adAmount, 
                        trxId: `ad_p${advert._id}`, 
                        paymentRef: Date.now(),
                        trxType: "Ad Payment",
                        status: "Approved Successful"
                    });

                if (!transaction) {
                    res.status(400).json("Failed to create transaction")
                    throw new Error("Failed to create transaction")
                }
                
                if (advert && transaction) {
                    res.status(201).json(advert);
                }

                }
    }
            }

            } catch (error) {
                res.status(500).json({error: error.message});
            }
 });


 //Get user Advert
 // http://localhost:6001/api/advert
export const  getAdvert = asyncHandler(async (req, res) => {
    //const { userId } = req.body
    const { _id } = req.user
    try {
          const adverts = await Advert.find({userId: _id}).sort("-createdAt")
         if(!adverts) {
             res.status(400).json({ msg: "Cannot find any ad for this user" })
             throw new error("Cannot find any ad for this user")
         } 
         
         if (adverts) {
           res.status(200).json(adverts)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })


  //Get All Advert
 // http://localhost:6001/api/advert/all
export const  getAllAdvert = asyncHandler(async (req, res) => {
        try {
            const advert = await Advert.find().sort("-createdAt")
           if(!advert) {
               res.status(400).json({ msg: "No advert found in the database" })
           } else {
            res.status(200).json(advert)
           }
    
    
       } catch (error) {
           res.status(500).json({error: error.message});
       }

      })