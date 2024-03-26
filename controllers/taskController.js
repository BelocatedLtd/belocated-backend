import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from "../model/Advert.js";
import Task from '../model/Task.js'
import Wallet from "../model/Wallet.js";
import { v2 as cloudinary } from 'cloudinary'
import sendEMail from "../utils/sendEmail.js";

// import cloudinary from "../utils/cloudinary.js";
//import { fileSizeFormatter } from "../utils/fileUpload.js";
//import {uploadMultipleImages} from '../utils/cloudinary.js'



//Create New Task
// http://localhost:6001/api/tasks/create
export const CreateNewTask = asyncHandler(async (req, res) => {
    const { advertId, advertiserId, taskPerformerId, title, platform, service, desiredROI, toEarn, gender, state, lga, caption, taskVerification, socialPageLink, adMedia } = req.body;

    const advert = await Advert.findById(advertId)

    if (!advert) {
        res.status(404).json({message: "The advert for this task could not be found"});
        throw new Error("The advert for this task could not be found")
    }

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

    // Gets details about the task submitted, advert for the task, user or task performer and user wallet.
    const task = await Task.findById(taskId)
    const advert = await Advert.findById(task.advertId)
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.find({userId: req.user._id}) 
 
    // If task cannot be found
    if (!task) {
        res.status(400).json({message: "Cannot find task"});
        throw new Error("Cannot find task")
    }

    // If advert cannot be found
    if (!advert) {
        res.status(400).json({message: "Cannot find the ad for this task"});
        throw new Error("Cannot find the ad for this task")
    } 

    // If user wallet cannot be found
    if (!wallet) {
        res.status(400).json({message: "Cannot find user Wallet to update"});
        throw new Error("Cannot find user Wallet to update")
    }

    // If ad campaign is no longer active
    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer active"});
        throw new Error("Ad campaign is no longer active")
    }

    // If user has already submtted task for this advert
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

    // If Advert is a free advert
   if (advert.isFree === true) {

    // Check if user has fulfilled the weekly free task obligation
    if (user.freeTaskCount > 0) {
        user.freeTaskCount -=  1;

        //save the update on user model
        const subtractFreeTaskCount = await user.save(); 
    
        if (!subtractFreeTaskCount) {
            res.status(500).json({message: "Failed to subtract from free task count"})
            throw new Error("Failed to subtract from free task count")
        } 
   }

   res.status(200).json("Task submitted successfully, wait for Admin's Approval");
}

    // If Advert is a paid advert - Update User wallet
    if (advert.isFree === false) {

        // Adds money to the task performer's pending balance
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

        if (!updatedUserWallet) {
            res.status(400).json({message: "failed to update user pending balance"});
            throw new Error("failed to update user pending balance")
        }
    
        // if (updatedUserWallet) {
        //     res.status(200).json("Task submitted successfully, wait for Admin's Approval");
        // }
    }

    // Whether free task or paid task
    // desiredROI for the advert should be subtracted by 1 and if zero, ad status should be changed to Completed
    //subtrate 1 from the desired roi
    //Update the number of tasks completed on an advert
    advert.desiredROI -= 1;
    advert.tasks += 1;

    //save the update on user model
    const updatedAdvert = await advert.save(); 

    if (!updatedAdvert) {
        res.status(500).json({message: "Failed to submit task"})
        throw new Error("Failed to submit task")
    }

    if (updatedAdvert) {

        if (updatedAdvert.desiredROI === 0) {
            advert.status = "Completed"
    
            const updatedAdvertStatus = await advert.save();

            if (!updatedAdvertStatus) {
                res.status(500).json({message: "Failed to change ad status"})
                throw new Error("Failed to change ad status")
            }
        }
        
        res.status(200).json("Task submitted successfully, wait for Admin's Approval");
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
    const wallet = await Wallet.findOne({userId: task?.taskPerformerId})
    const taskPerformer = await User.findById(task?.taskPerformerId)
    const advertiser = await User.findById(task.advertiserId)
    const advertserWallet = await Wallet.findOne({userId:  task?.advertiserId})

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

    if (!advertiser) {
        res.status(400).json({message: "Cannot find Advertiser"});
        throw new Error("Cannot find Advertiser")
    }

    if (!advert) {
        res.status(400).json({message: "Cannot find the ad for this task"});
        throw new Error("Cannot find the ad for this task")
    }

    // Check if admin is the moderator asigned to the advert for this task
    //Check if user is an admin
    // if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
    //     res.status(400).json({message: "You are not assigned to moderate this task"});
    //     throw new Error("You are not assigned to moderate this task")
    // }

    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer running"});
        throw new Error("Ad campaign is no longer running")
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

    // When advert is a paid advert. Payment should be approved
    if (advert.isFree === false) {
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


   // When advert is free
    // User freetask count should be subtracted by 1 and if its zero, an email should be sent.
    if (advert.isFree === true) {
    //User has completed the free task count for the week - Send email to the user
        if (taskPerformer.freeTaskCount === 0 && status === "Approved") {
            //Send Free Task Completed Email
            const message = `
            <h2>Congratulations ${taskPerformer?.username}!</h2>
            <p>You have successfully completed your two free task for the week</p>
            <p>Kindly return to your dashboard, refresh and click on earn to access paid tasks for this week.</p>
            <p>For any other question, kindly join our telegram group, send an email or send a WhatsApp message to chat with a customer rep.</p>
            <label>Link to Telegram group:</label><a href="https://t.me/beloacted">https://t.me/beloacted</a>
            <label>WhatsApp:</label><a href="https://wa.me/2347031935276">https://wa.me/2347031935276</a>
            <label>Email:</label><p>cs@belocated.ng</p>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `
            const subject = 'Free Task Completed!'
            const send_to = taskPerformer?.email
            const reply_to = "noreply@noreply.com"

            //Finally sending email
            const emailSent = await sendEMail(subject, message, send_to, reply_to)

            if (!emailSent) {
            res.status(500).json('Email sending failed');
            throw new Error('Email sending failed')
            }
        }
    }
    
    //Update the list of taskperformers.
    advert.taskPerformers.push(taskPerformer.username);
    
    await advert.save();  
    

    res.status(200).json(updatedTask);
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
    const wallet = await Wallet.findOne({userId: task.taskPerformerId})
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

    // Check if admin is the moderator asigned to the advert for this task
    //Check if user is an admin
    if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
        res.status(400).json({message: "You are not assigned to moderate this task"});
        throw new Error("You are not assigned to moderate this task")
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

    if (advert.isFree === true) {
        taskPerformer.freeTaskCount +=  1;
    
            //save the update on user model
            const addFreeTaskCount = await taskPerformer.save(); 
        
            if (!addFreeTaskCount) {
                res.status(500).json({message: "Failed to return rejected free task count"})
                throw new Error("Failed to return rejected free task count")
            } 
    }

    // Subtract Task performer's Wallets

    // Update the pendingBalance
    wallet.pendingBalance -= task.toEarn;
    
        //save subtracted user wallet
    const walletSubUpdate = await wallet.save();

    if (!walletSubUpdate) {
        res.status(500).json({message:"Failed to subtract user pending balance wallet"})
        throw new Error("Failed to update user wallet")
    } 

    
    // Whether free task or paid task
    // desiredROI for the advert should be added back by 1, ad status should be changed to Running
    //Add 1 back to the desired roi
    //Subtract the number of tasks completed on an advert
    advert.desiredROI += 1;
    advert.tasks -= 1;
    advert.status = "Running"

    //save the update on user model
    const updatedAdvert = await advert.save(); 

    if (!updatedAdvert) {
        res.status(500).json({message: "Failed to reject task"})
        throw new Error("Failed to failed task")
    }

    res.status(400).json(task);
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





