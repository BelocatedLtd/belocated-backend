import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import Advert from '../model/Advert.js'
import Transaction from "../model/Transaction.js";
import { v2 as cloudinary } from 'cloudinary' 


//Create New Advert
// http://localhost:6001/api/advert/create
export const createAdvert = asyncHandler(async (req, res) => {
    const { userId, platform, service, adTitle, desiredROI, costPerTask, earnPerTask, gender, state, lga, caption, adAmount, socialPageLink } = req.body;

         // Validation
         if ( !platform || !service || !adTitle|| !desiredROI || !costPerTask || !earnPerTask || !gender || !state || !lga || !adAmount ) {
            res.status(400).json({message: 'Please fill in all the required fields'});
            throw new Error("Please fill in all fields")
         }

         const admins = await User.find({ accountType: "Admin" });

         if (!admins) {
            res.status(500).json({message: 'No admin found'});
            throw new Error("No admin found")
         }

         try {
            // Getting user wallet
            const wallet = await Wallet.findOne({userId: req.user._id})
            if (!wallet) {
                res.status(400).json({message: "Wallet not found"})
                throw new Error("Wallet not found")
            }
    
            // Checking if user wallet is sufficient to fund ad purchase
            if (wallet.value < adAmount) {
                res.status(400).json({message: "Wallet insufficient to pay for ad, please fund wallet"})
                throw new Error("Wallet insufficient to pay for ad, please fund wallet") 
            }

             //Cloudinary configuration
            // Return "https" URLs by setting secure: true
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });

   
                //Upload screenshots to databse
                let uploadedImages = [];

                if(req.files) {
                
                    try {
                    
                        for (const file of req.files) {
                            const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto', folder: 'Advert Media Contents' });
                    
                                uploadedImages.push({
                                    secure_url: result.secure_url,
                                    public_id: result.public_id
                                });
                            }
                            } catch (error) {
                                console.error(error);
                                res.status(500).json({message: "Error uploading images"})
                            }
                }

    // Randomly pick an admin to moderate the tasks to be submitted for this advert.

    // Generate a random index within the range of the admins array length
    const randomIndex = Math.floor(Math.random() * admins.length);

    // Retrieve the admin object at the randomly generated index
    const selectedAdmin = admins[randomIndex];

            //After image has being uploaded to cloudinary - Now create advert
            
                //Create New Advert
               const  advert = await Advert.create({
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
                status: "Pending Payment", //Pending Payment, Running, Allocating, Allocated, Completed
            });
            
            if (!advert) {
                res.status(400).json({message: "Advert wasnt created, please try again"});
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
                res.status(400).json({message: "Cannot access user wallet to make ad payment"})
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
                    res.status(400).json({message: "Failed to switch ad status to running"})
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
                    res.status(400).json({message: "Failed to create transaction"})
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

//Change Advert Free Status
// http://localhost:6001/api/advert/create
export const toggleAdvertFreeStatus = asyncHandler(async (req, res) => {
    const { advertId } = req.body;

    const advert = await Advert.findById(req.params.id)

    const user = await User.findById(req.user._id)

    if(user.accountType !== "Admin") {
        res.status(401).json({message: "Unauthorized User"})
        throw new Error("Unauthorized User")
    }

    if (!advert) {
        res.status(404).json({message: "Cannot find advert"})
        throw new Error("Failed to find Advert")
    }

    if (advert.isFree === false) {
        advert.isFree = true

        const toggleAdTypeFalseToTrue = advert.save() 

        if (!toggleAdTypeFalseToTrue) {
            res.status(404).json({message: "Failed to change advert type"});
            throw new Error
        }

        res.status(200).json(toggleAdTypeFalseToTrue)
        return
    }

    if (advert.isFree === true) {
        advert.isFree = false

        const toggleAdTypeTrueToFalse = advert.save() 
      
        if (!toggleAdTypeTrueToFalse) {
            res.status(404).json({message: "Failed to change advert type"});
            throw new Error
        }

        res.status(200).json(toggleAdTypeTrueToFalse)
        return
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
             res.status(400).json({ mesage: "Cannot find any ad for this user" })
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
               res.status(400).json({ message: "No advert found in the database" })
           } else {
            res.status(200).json(advert)
           }
    
    
       } catch (error) {
           res.status(500).json({error: error.message});
       }

      })


//>>> Delete Advert
export const deleteAdvert = asyncHandler(async(req, res) => {
    const {advertId} = req.params
  
    if (req.user.accountType !== "Admin") {
      res.status(401).json({message: "User not authorized to perform this action"});
      throw new Error("User not authorized to perform this action")
    }
  
    const advert = await Advert.findById({_id: advertId })
    
    if(!advert) {
        res.status(400).json({message: "Advert does not exist or already deleted"})
        throw new Error("Advert does not exist or already deleted")
    } 
  
    const delAdvert = await Advert.findByIdAndDelete(advertId)
  
    if (!delAdvert) {
      res.status(500).json({message: "Error Deleting Advert"});
      throw new Error("Error Deleting Advert")
    }
  
    res.status(200).json("Advert Deleted successfully")
  })