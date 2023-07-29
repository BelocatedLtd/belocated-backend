import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from "../model/Advert.js";
import Task from '../model/Task.js'
import Wallet from "../model/Wallet.js";
import { v2 as cloudinary } from 'cloudinary'

// import cloudinary from "../utils/cloudinary.js";
//import { fileSizeFormatter } from "../utils/fileUpload.js";
//import {uploadMultipleImages} from '../utils/cloudinary.js'



//Create New Task
// http://localhost:6001/api/tasks/create
export const CreateNewTask = asyncHandler(async (req, res) => {
    const { advertId, advertiserId, taskPerformerId, title, platform, service, desiredROI, toEarn, gender, state, lga, caption, taskVerification, socialPageLink, adMedia } = req.body;

    //Create New Task
    const task = await Task.create({
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
            public_id: "",
            url: "",
        },
        nameOnSocialPlatform: '',
        adMedia,
        status: "Awaiting Submission"
    });

    if (!task) {
        res.status(500).json({message: "Failed to add user to perform this task"});
        throw new Error("Failed to add user to perform this task")
    }

    if (task) {
        res.status(201).json(task);
    } 

 });

 //Get user Task
 // http://localhost:6001/api/tasks/task
export const  getTask = asyncHandler(async (req, res) => {
    //const { taskId } = req.body
    try {
          const tasks = await Task.find({taskPerformerId: req.user._id})

         if(!tasks) {
             res.status(400).json({ message: "Cannot find task" })
             throw new Error("Cannot find task")
         } 
         
         if (tasks) {
           res.status(200).json(tasks)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })


 //Get user Tasks
 // http://localhost:6001/api/tasks
export const  getTasks = asyncHandler(async (req, res) => {
    const { _id } = req.user

    if (req.user.accountType !== "Admin") {
        res.status(401).json({message:"Not Authorized"})
        throw new Error("Not authorized")
    }

    if (req.user.accountType === "Admin") {
        let tasks;

        tasks = await Task.find().sort("-createdAt")

        if(!tasks) {
            res.status(400).json({message: "Cannot find any task"})
            throw new error("Cannot find any task")
        } 

        if (tasks) {
            res.status(200).json(tasks)
         }
    }
  })


//Submit Task
// http://localhost:6001/api/tasks/submit
export const submitTask = asyncHandler(async (req, res) => {
    const { taskId,  userSocialName } = req.body;

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(task.advertId)
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.find({userId: req.user._id}) 

    // res.status(200).json(advert);
    // return

    if (!task) {
        res.status(400).json({message: "Cannot find task"});
        throw new Error("Cannot find task")
    }

    if (!advert) {
        res.status(400).json({message: "Cannot find the ad for this task"});
        throw new Error("Cannot find user Wallet to update")
    }

    if (!wallet) {
        res.status(400).json({message: "Cannot find user Wallet to update"});
        throw new Error("Cannot find user Wallet to update")
    }

    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer active"});
        throw new Error("Ad campaign is no longer active")
    }

    if (task.status === "Submitted") {
        res.status(400).json({message: "You have already submitted this task, you can only submit once, please wait for approval"});
        throw new Error("You have submitted your task, you can only submit once, please wait for approval")
    }

    //Cloudinary configuration
// Return "https" URLs by setting secure: true
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

   
    //Upload screenshots to databse
    let updatedTask;

    if(req.files) {
       
        try {
            const uploadedImages = [];
        
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, { folder: 'Task Submit Screenshots' });
        
                    uploadedImages.push({
                        secure_url: result.secure_url,
                        public_id: result.public_id
                    });
        
                }
        
                updatedTask = await Task.findByIdAndUpdate(
                    { _id: taskId },
                    {
                        nameOnSocialPlatform: userSocialName || task.userSocialName,
                        proofOfWorkMediaURL: uploadedImages,
                        status: "Submitted" || task.status
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )
           } catch (error) {
            console.error(error);
            res.status(500).json({message: "Error uploading images"})
           }
    }

   if (user.freeTaskCount > 0) {
    res.status(200).json("Task submitted successfully, wait for Admin's Approval");
   }

    // Update User wallet
    if (user.freeTaskCount === 0) {

        const updatedAdvertiserWallet = await Wallet.updateOne(
            { userId:  task.advertiserId},
            {
                $inc: {value: -advert.costPerTask}
            },
            {
                new: true,
                runValidators: true
            }
        )

        const updatedUserWallet = await Wallet.updateOne(
            { userId:  req.user._id},
            {
                $inc: {pendingBalance: task.toEarn}
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!updatedUserWallet && !updatedAdvertiserWallet) {
            res.status(400).json({message: "failed to update user pending balance and advertiser Wallet"});
            throw new Error("failed to update user pending balance")
        }
    
        if (updatedUserWallet && updatedAdvertiserWallet) {
            res.status(200).json("Task submitted successfully, wait for Admin's Approval");
        }
    }
 });


 // Admin Approve Submitted Tasks and Pay user
 export const approveTask = asyncHandler(async (req, res) => {
    const { taskId, status, message } = req.body

    //Check if user is an admin
    if (req.user.accountType !== "Admin") {
        res.status(400).json({message: "User Not Authorized"});
        throw new Error("User Not Authorized")
    }

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(task?.advertId)
    const wallet = await Wallet.find({userId: task?.taskPerformerId})
    const taskPerformer = await User.findById(task?.taskPerformerId)
    const advertserWallet = await Wallet.find({userId:  task?.advertiserId})

    if (!task) {
        res.status(400).json({message:"Cannot find task"});
        throw new Error("Cannot find task")
    }

    if (task.status === "Approved") {
        res.status(400).json({message: "This task has already being approved, you can only be paid once for an approved Task, please perform another task"});
        throw new Error("This task has already being approved, you can only be paid once for an approved Task, please perform another task")
    }

    if (!wallet) {
        res.status(400).json({message:"Cannot find user Wallet for payment"});
        throw new Error("Cannot find user Wallet for payment")
    }

    if (!taskPerformer) {
        res.status(400).json({message:"Cannot find task performer details"});
        throw new Error("Cannot find task performer details")
    }

    if (!advertserWallet) {
        res.status(400).json({message: "Cannot find Advertisers Wallet for payment retrieval"});
        throw new Error("Cannot find user Wallet Advertisers for payment retrieval")
    }

    if (!advert) {
        res.status(400).json({message: "Cannot find the ad for this task"});
        throw new Error("Cannot find the ad for this task")
    }

    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer active"});
        throw new Error("Ad campaign is no longer active")
    }

    let updatedTask;

    if (status === "Partial Approval") {
         //Update task status after user submit screenshot
        task.status =  status;
        task.message = message

        //save the update on task model
        updatedTask = await task.save(); 
    } 
    
    if (status === "Approved") {
        //Update task status after user submit screenshot
        task.status =  "Approved";

        //save the update on task model
        updatedTask = await task.save();  
    }

    

    if (!updatedTask) {
        res.status(500).json({message: "Error trying to update task status"})
        throw new Error("Failed to approve task")
    }


    if (updatedTask) {
    // Check if user has fulfilled the weekly free task obligation
    if (taskPerformer.freeTaskCount > 0 && status === "Approved") {
        taskPerformer.freeTaskCount -=  1;

        //save the update on user model
        const subtractFreeTaskCount = await taskPerformer.save(); 
    
        if (!subtractFreeTaskCount) {
            res.status(500).json({message: "Failed to subtract from free task count"})
            throw new Error("Failed to subtract from free task count")
        } 

        //subtrate 1 from the desired roi
        //Update the number of tasks completed on an advert
        advert.desiredROI -= 1;
        advert.tasks += 1;

        //save the update on user model
        const updatedAdvert = await advert.save(); 

        if (!updatedAdvert) {
            res.status(500).json({message: "Failed to approve task"})
            throw new Error("Failed to approve task")
        }
        
    }

    //User' can completed hisher free task count
    if (taskPerformer.freeTaskCount === 0 && status === "Approved") {
        //Update Advert after user admin Approves Task Submittion
        //subtrate 1 from the desired roi
        //Update the number of tasks completed on an advert
        advert.desiredROI -= 1;
        advert.tasks += 1;

        //save the update on user model
        const updatedAdvert = await advert.save(); 

        if (!updatedAdvert) {
            res.status(500).json({message: "Failed to approve task"})
            throw new Error("Failed to approve task")
        }

        
        // Update Task performer's Wallets
        wallet.pendingBalance -= task.toEarn;
        wallet.value += task.toEarn;
        wallet.totalEarning += task.toEarn

        //save the update on user wallet
        const updatedTaskPerformerWallet = await wallet.save(); 

        if (!updatedTaskPerformerWallet) {
            res.status(500).json({message:"Failed to update user wallet"})
            throw new Error("Failed to update user wallet")
        }
    }


    //Check if advertunit is zero and mark advert as completed
    if (advert.desiredROI === 0 && status === "Approved") {
        advert.status = "Completed"

        //save the update on user model
        const updatedAdvert = await advert.save(); 

        if (!updatedAdvert) {
            res.status(500).json({message: " Advert unit completed, but advert could not be marked complete"});
            throw new Error("Error, Advert unit exhausted, but advert could not be marked complete")
        }
    }
}

        res.status(200).json(task);
 })

  // Admin Reject Submitted Tasks and Pay user
  export const rejectTask = asyncHandler(async (req, res) => {
    const { taskId, message } = req.body

    //Check if user is an admin
    if (req.user.accountType !== "Admin") {
        res.status(400).json({message: "User Not Authorized"});
        throw new Error("User Not Authorized")
    }

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(task.advertId)
    const wallet = await Wallet.find({userId: task.taskPerformerId})
    const taskPerformer = await User.findById(task.taskPerformerId)
    const advertserWallet = await Wallet.find({userId: task.advertiserId})

    if (!task) {
        res.status(400).json({message:"Cannot find task"});
        throw new Error("Cannot find task")
    }

    if (task.status === "Rejected") {
        res.status(400).json({message: "This task has already being rejected, read the admins message and follow the instructions"});
        throw new Error("This task has already being rejected, read the admins message and follow the instructions")
    }

    if (task.status === "Approved") {
        res.status(400).json({message: "This task has already being approved, to avoid double payments and confusion to the system, you cant reject and already approved task. Contact Admin"});
        throw new Error("This task has already being approved, to avoid double payments and confusion to the system, you cant reject and already approved task. Contact Admin")
    }

    if (!wallet) {
        res.status(400).json({message:"Cannot find user Wallet"});
        throw new Error("Cannot find user Wallet")
    }

    if (!taskPerformer) {
        res.status(400).json({message:"Cannot find task performer details"});
        throw new Error("Cannot find task performer details")
    }

    if (!advertserWallet) {
        res.status(400).json({message: "Cannot find Advertisers Wallet for payment retrieval"});
        throw new Error("Cannot find user Wallet Advertisers for payment retrieval")
    }

    if (!advert) {
        res.status(400).json({message: "Cannot find the ad for this task"});
        throw new Error("Cannot find user Wallet to update")
    }

    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer active"});
        throw new Error("Ad campaign is no longer active")
    }

    //Update task status after user submit screenshot
    task.status =  "Rejected";
    task.message = message

    //save the update on task model
    const updatedTask = await task.save(); 

    if (!updatedTask) {
        res.status(500).json({message: "Error trying to update task status"})
        throw new Error("Failed to approve task")
    }

    //Rejection Successful
    if (taskPerformer.freeTaskCount === 0) {
    // Subtract Task performer's Wallets
    wallet.pendingBalance -= task.toEarn

    //save subtracted user wallet
    const walletsubupdate = await wallet.save();

    if (!walletsubupdate) {
        res.status(500).json({message:"Failed to subtract user pending balance wallet"})
        throw new Error("Failed to update user wallet")
    }
    
}  

        res.status(200).json(task);
 })

 //>>> Delete Task
export const deleteTask = asyncHandler(async(req, res) => {
    const {taskId} = req.params
  
    if (req.user.accountType !== "Admin") {
      res.status(401).json({message: "User not authorized to perform this action"});
      throw new Error("User not authorized to perform this action")
    }
  
    const task = await Task.findById({_id: taskId })
    
    if(!task) {
        res.status(400).json("Task does not exist or already deleted")
    } 
  
    const delTask = await Task.findByIdAndDelete(taskId)
  
    if (!delTask) {
      res.status(500).json({message: "Error Deleting Task"});
      throw new Error("Error Deleting Task")
    }
  
    res.status(200).json("Task Deleted successfully")
  })





