import asyncHandler from "express-async-handler";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";


//Get User Wallet
export const  getUserWallet = asyncHandler(async (req, res) => {
    const { _id } = req.user

    try {
        const wallet = await Wallet.findOne({userId: _id})
         if(!wallet) {
             res.status(400).json("No User Wallet Found")
         } else {
            res.status(200).json(wallet)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })

//Get User Wallet
export const  getWallet = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (req.user.accountType !== "Admin") {
        res.status(401).json({message: "Not Authorized"});
        throw new Error("Not Authorized")
    }

    const wallet = await Wallet.findOne({userId})

        if(!wallet) {
            res.status(400).json({message: "No User Wallet Found"})
            throw new Error("No User Wallet Found")
        }

        res.status(200).json(wallet)
  })


  //Fund User Wallet 
  export const fundUserWallet = asyncHandler(async(req, res) => {
    const { userId, email, date, chargedAmount, trxId, paymentRef, status } = req.body;

         // Validation
         if ( !userId || !chargedAmount || !trxId || !paymentRef ) {
            res.status(400).json({message: 'Some required fields are missing!'});
            throw new error("Some required fields are empty")
         }

         // Validation
        //  if ( status ==! "Approved Successful" ) {
        //     res.status(400).json('This payment has not being approved');
        //     throw new error("This payment has not being approved")
        //  }

         // Match userId from req.body with server logged in user
        //  if (userId !== req.user._id) {
        //     res.status(401).json("User not authorized 1") 
        // }

         try {
            // Getting user wallet
            const wallet = await Wallet.findOne({userId: req.user._id})
            if (!wallet) {
                res.status(400).json({message: "Wallet not found"})
                throw new error("wallet not found")
            }
    
           // Match existing wallet to the loggedin user 
            if (wallet.userId !== userId) {
                res.status(401).json({message: "User not authorized 2"}) 
                throw new error("User not authorized 2")
            }
            
            // Update User wallet
            const updatedUserWallet = await Wallet.updateOne(
                { userId:  req.user._id},
                {
                    $inc: {value: chargedAmount}
                },
                {
                    new: true,
                    runValidators: true
                }
            )

            if (!updatedUserWallet) {
                res.status(401).json({message: "Faild to fund wallet, contact Admin"}) 
                throw new error("Faild to fund wallet, contact Admin")
            }

            if (updatedUserWallet) {
                //Create New Transaction
             const transaction = await Transaction.create({
                userId, 
                email, 
                date, 
                chargedAmount, 
                trxId, 
                paymentRef,
                trxType: "wallet funding",
                status
            });

            if (transaction) {
                const updatedWallet = await Wallet.findOne({userId: req.user._id})
                res.status(201).json(updatedWallet);
            }

        }
            
            
         } catch (error) {
            res.status(500).json({error: error.message});
         }
            

  })

   //Get user Transactions
 // http://localhost:6001/api/transactions/userall
export const  getUserTransactions = asyncHandler(async (req, res) => {
    const { _id } = req.user
    try {
          const transactions = await Transaction.find({userId: _id}).sort("-createdAt")
         if(!transactions) {
             res.status(400).json({ message: "Cannot find any transaction made by this user" })
             throw new error("Cannot find any transaction made by this user")
         } 
         
         if (transactions) {
           res.status(200).json(transactions)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })

  /*  GET ALL TRANSACTIONS */
// http://localhost:6001/api/transactions/all
export const  getTransactions = asyncHandler(async(req, res) => {

    if (req.user.accountType !== "Admin") {
        res.status(400).json({message: "Not authorized"});
        throw new Error("Not authorized") 
    }

    const transactions = await Transaction.find().sort("-createdAt")
       
    if(!transactions) {
        res.status(400).json({message: "No transaction found in the database"})
        throw new Error("No transaction found in the database")
       } 

    res.status(200).json(transactions)

  })