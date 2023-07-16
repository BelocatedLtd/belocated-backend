import asyncHandler from "express-async-handler";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";
import Withdraw from "../model/Withdraw.js";
import User from "../model/User.js";


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

   //Withdraw User Wallet 
   export const withdrawWallet = asyncHandler(async(req, res) => {
    const { userId, withdrawAmount,  withdrawalMethod } = req.body;

    

     // Validation
     if ( !userId || !withdrawAmount || !withdrawalMethod ) {
        res.status(400).json({message: 'Some required fields are missing!'});
        throw new error("Some required fields are empty")
     }

    const user = await User.findById(req.user.id)
    const wallet = await Wallet.findOne({userId: user._id})  

     // Validation
         if ( !user ) {
            res.status(404).json({message: 'User not found'});
            throw new error("User not found")
         }

         if (!wallet) {
            res.status(400).json({message: "User Wallet not found"})
            throw new error("User Wallet not found")
        }

         try {
            // Update User wallet
            wallet.value -= withdrawAmount

            const updatedUserWallet = wallet.save()

    
            if (!updatedUserWallet) {
                res.status(401).json({message: "Faild to withdraw from wallet, contact Admin"}) 
                throw new error("Faild to fund wallet, contact Admin")
            }

            let withdrawalRequest;

            if (updatedUserWallet) {
                withdrawalRequest = await Withdraw.create({
                    userId, 
                    withdrawAmount, 
                    status: "Pending Approval",
                    withdrawMethod: withdrawalMethod
                })

                if (!withdrawalRequest) {
                    res.status(500).json({message: "Error creating withdrawal request"});
                    throw new Error("Error creating withdrawal request")
                }


                   //Create New Transaction
                const transaction = await Transaction.create({
                    userId: withdrawalRequest._id, 
                    email: user.email, 
                    date: Date.now(), 
                    chargedAmount: withdrawAmount, 
                    trxId: `wd-${userId}`,
                    paymentRef: `wd-${userId}`,
                    trxType: `Withdraw by - ${withdrawalMethod}`,
                    status: "Pending Approval"
                });

                if (!transaction) {
                    res.status(500).json({message: "Error creating transaction"});
                    throw new Error("Error creating transaction")
                }
            }

            res.status(200).json(wallet)  
            
         } catch (error) {
            res.status(500).json({error: error.message});
         }
            

  })

     //Get all user Withdrawals
export const getWithdrawals = asyncHandler(async (req, res) => {

    if (req.user.accountType !== "Admin") {
        res.status(401).json({ message: "Unauthorized user" })
        throw new error("Unauthorized user")
    }
    
    try {
          const withdrawals = await Withdraw.find().sort("-createdAt")
         if(!withdrawals) {
             res.status(400).json({ message: "Withdrawal request list empty" })
             throw new error("Withdrawal request list empty")
         } 
         
         if (withdrawals) {
           res.status(200).json(withdrawals)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })


       //Confirm Withdrawal Request
export const confirmWithdrawalRequest = asyncHandler(async (req, res) => {
    const { withdrawalRequestId } = req.params

    if (req.user.accountType !== "Admin") {
        res.status(401).json({ message: "Unauthorized user" })
        throw new error("Unauthorized user")
    }

    const wdRequest = await Withdraw.findById(withdrawalRequestId)
    const wdTrx = await Transaction.find({userId: withdrawalRequestId})

    res.status(200).json(wdTrx)
    return

    if (!wdRequest) {
        res.status(400).json({message:"Cannot find withdrawal request"});
        throw new Error("Cannot find withdrawal request")
    }

    if (!wdTrx) {
        res.status(400).json({message:"Cannot find withdrawal trx"});
        throw new Error("Cannot find withdrawal trx")
    }

    if (wdRequest.status === "Approved") {
        res.status(400).json({message: "This withdrawal request has already being approved"});
        throw new Error("This withdrawal request has already being approved")
    }

    //Update task status after user submit screenshot
    wdRequest.status =  "Approved";

    //save the update on task model
    const updatedwdRequest = await wdRequest.save(); 

    if (!updatedwdRequest) {
        res.status(500).json({message: "Error trying to update task status"})
        throw new Error("Failed to approve task")
    }

    if (updatedwdRequest) {
        //Update task status after user submit screenshot
        wdTrx.status =  "Approved";

        //save the update on task model
        const updatedTrx = await wdTrx.save(); 

        if (!updatedTrx) {
            res.status(500).json({message: "Error trying to update trx status"})
            throw new Error("Error trying to update trx status")
        }
    }  

    res.status(200).json(updatedwdRequest)
  })


        //Delete Withdrawal Request
export const deleteWithdrawalRequest = asyncHandler(async (req, res) => {
    const { withdrawalRequestId } = req.params

    if (req.user.accountType !== "Admin") {
        res.status(401).json({ message: "Unauthorized user" })
        throw new error("Unauthorized user")
    }

    const wdRequest = await Withdraw.findById(withdrawalRequestId)

    if (!wdRequest) {
        res.status(400).json({message:"Withdrawal request does not exist or already deleted"});
        throw new Error("Withdrawal request does not exist or already deleted")
    }

    const delWdRequest = await Withdraw.findByIdAndDelete(withdrawalRequestId)
  
    if (!delWdRequest) {
      res.status(500).json({message: "Error Deleting"});
      throw new Error("Error Deleting")
    }

    const wdRequests = await Withdraw.find().sort("-createdAt")
    res.status(200).json(wdRequests)
  })

     //Get user Transactions
 // http://localhost:6001/api/transactions/userall
export const  getUserWithdrawals = asyncHandler(async (req, res) => {
    const { _id } = req.user

    try {
          const withdrawals = await Withdraw.find({userId: _id}).sort("-createdAt")
         if(!withdrawals) {
             res.status(400).json({ message: "Cannot find any withdrawal request made by this user" })
             throw new error("Cannot find any withdrawal request made by this user")
         } 
         
         if (withdrawals) {
           res.status(200).json(withdrawals)
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