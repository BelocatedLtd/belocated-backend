import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from "../model/Advert.js";
import Task from '../model/Task.js'
import Wallet from "../model/Wallet.js";
import { v2 as cloudinary } from 'cloudinary'
import { updateUser } from "./userController.js";
//import cloudinary from "../utils/cloudinary.js";



//Create New Task
// http://localhost:6001/api/tasks/create
export const CreateNewTask = asyncHandler(async (req, res) => {
    const { advertId, advertiserId, taskPerformerId, title, platform, service, desiredROI, toEarn, gender, state, lga, caption, socialPageLink } = req.body;

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
        socialPageLink,
        proofOfWorkMediaURL: {
            public_id: "",
            url: "",
        },
        nameOnSocialPlatform: '',
        status: "Awaiting Submission"
    });

    if (task) {
        res.status(201).json(task);
    } else {
        throw new error("Failed to add user to perform this task")
    }

 });

 //Get user Task
 // http://localhost:6001/api/tasks/task
export const  getTask = asyncHandler(async (req, res) => {
    //const { taskId } = req.body
    try {
          const tasks = await Task.find({taskPerformerId: req.user._id})

         if(!tasks) {
             res.status(400).json({ msg: "Cannot find task" })
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
        res.status(401).json("Not Authorized")
        throw new Error({message: "Not authorized"})
    }

    if (req.user.accountType === "Admin") {
        let tasks;

        tasks = await Task.find().sort("-createdAt")

        if(!tasks) {
            res.status(400).json("Cannot find any task")
            throw new error({message: "Cannot find any task"})
        } 

        if (tasks) {
            res.status(200).json(tasks)
         }
    }
  })


//Submit Task
// http://localhost:6001/api/tasks/submit
export const submitTask = asyncHandler(async (req, res) => {
    const { taskId, advertId, taskPerformerId, userSocialName, mediaUrl, status } = req.body;

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(advertId)
    const wallet = await Wallet.find({userId: req.user._id}) 

    if (!task) {
        res.status(400).json({msg: "Cannot find task"});
        throw new Error("Cannot find task")
    }

    if (task.status === "Submitted") {
        res.status(400).json({msg: "You have already submitted this task, you can only submit once, please wait for approval"});
        throw new Error("You have submitted your task, you can only submit once, please wait for approval")
    }

    if (!wallet) {
        res.status(400).json({msg: "Cannot find user Wallet to update"});
        throw new Error("Cannot find user Wallet to update")
    }

    if (!advert) {
        res.status(400).json({msg: "Cannot find the ad for this task"});
        throw new Error("Cannot find user Wallet to update")
    }

    //Upload Media to Cloudinary

    if (!req.file) {
        res.status(400).json({msg: "Cannot read media file"});
        throw new Error("Cannot read media file")
    }

    let result;

    if (req.file) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });

          result = await cloudinary.uploader.upload(req.file.path, {
            folder: "Task Submit Screenshots"
        })
    
    
        if (!result) {
            res.status(400).json({msg: "Failed to upload screenshot"});
            throw new Error("Failed to upload screenshot")
        }
    }
    

    //Update task after user submit screenshot
    const updatedTask = await Task.findByIdAndUpdate(
        { _id: taskId },
        {
            nameOnSocialPlatform: userSocialName || task.nameOnSocialPlatform,
            proofOfWorkMediaURL: {
                public_id: result.public_id,
                url: result.secure_url
            },
            status: status || task.status,
          
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!updatedTask) {
        res.status(400).json({msg: "Task could not be submitted"});
        throw new Error("Task could not be submitted")
    }

    // Update User wallet
    if (updatedTask) {
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
            res.status(400).json({msg: "failed to update user pending balance"});
            throw new Error("failed to update user pending balance")
        }
    
        if (updatedTask && updatedUserWallet) {
            const updatedTask = await Task.findById(taskId)
            res.status(200).json(updatedTask);
        }
    }
 });


 // Admin Approve Submitted Tasks and Pay user
 export const approveTask = asyncHandler(async (req, res) => {
    const { taskId, advertId, advertiserId, taskPerformerId, taskStatus, message } = req.body

    //Check if user is an admin
    if (req.user.accountType !== "Admin") {
        res.status(400).json({msg: "User Not Authorized"});
        throw new Error("User Not Authorized")
    }

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(advertId)
    const wallet = await Wallet.find({userId: taskPerformerId})
    const taskPerformer = await User.findById(taskPerformerId)
    const advertserWallet = await Wallet.find({userId: advertiserId})

    if (!task) {
        res.status(400).json("Cannot find task");
        throw new Error({message: "Cannot find task"})
    }

    if (task.status === "Approved") {
        res.status(400).json({message: "This task has already being approved, you can only be paid once for an approved Task, please perform another task"});
        throw new Error("This task has already being approved, you can only be paid once for an approved Task, please perform another task")
    }

    if (!wallet) {
        res.status(400).json("Cannot find user Wallet for payment");
        throw new Error("Cannot find user Wallet for payment")
    }

    if (!taskPerformer) {
        res.status(400).json("Cannot find task performer details");
        throw new Error("Cannot find task performer details")
    }

    if (!advertserWallet) {
        res.status(400).json({msg: "Cannot find Advertisers Wallet for payment retrieval"});
        throw new Error("Cannot find user Wallet Advertisers for payment retrieval")
    }

    if (!advert) {
        res.status(400).json({msg: "Cannot find the ad for this task"});
        throw new Error("Cannot find user Wallet to update")
    }

    if (advert.desiredROI === 0) {
        res.status(500).json({message: "Ad campaign is no longer active"});
        throw new Error("Ad campaign is no longer active")
    }

    //Update task status after user submit screenshot
    task.status =  taskStatus;

    //save the update on task model
    const updatedTask = await task.save(); 

    if (!updatedTask) {
        res.status(500).json("Error trying to update task status")
        throw new Error({message: "Failed to approve task"})
    }

    if (taskStatus === "Rejected") {
        task.message = message

        const updatedTaskMessage = await task.save();

        if (!updatedTaskMessage) {
            res.status(500);
            throw new Error({message: "Error updating task message"})
        }

        res.status(200).json("Task rejected, leave a message for the task performer")

        return
    }

    if (taskStatus === "Approved") {

    // Check if user has fulfilled the weekly free task obligation
    taskPerformer.freeTaskCount -=  1;

    //save the update on user model
    const subtractFreeTaskCount = await taskPerformer.save(); 

    if (!subtractFreeTaskCount) {
        res.status(500).json("Failed to approve task")
        throw new Error("Failed to approve task")
    }

    //Update Advert after user admin Approves Task Submittion
    //subtrate 1 from the desired roi
    //Update the number of tasks completed on an advert
    advert.desiredROI -= 1;
    advert.tasks += 1;

    //save the update on user model
    const updatedAdvert = await advert.save(); 

    if (!updatedAdvert) {
        res.status(500).json("Failed to approve task")
        throw new Error("Failed to approve task")
    }

    if (!updatedTask || !subtractFreeTaskCount || !updatedAdvert) {
        res.status(500).json("Error, Task could not be Approved");
        throw new Error("Error, Task could not be Approved")
    }

    // Update Task performer's Wallets
    if (updatedTask && subtractFreeTaskCount && updatedAdvert) {

    if (taskPerformer.freeTaskCount > 0) {
        res.status(200).json("Task approved but the weekly user free tasks obligation is stil active")
    }

    //Update Task Performer's Wallet
    if (taskPerformer.freeTaskCount === 0) {

        wallet.pendingBalance -= task.toEarn;
        wallet.value += task.toEarn;
        wallet.totalEarning += task.toEarn

    //save the update on user model
    const updatedTaskPerformerWallet = await wallet.save(); 

    if (!updatedTaskPerformerWallet) {
        res.status(500).json("Failed to update user wallet")
        throw new Error("Failed to update user wallet")
    }
    }


    if (updatedTaskPerformerWallet && updatedTask && subtractFreeTaskCount && updatedAdvert) {
        res.status(200).json(task);
    }

    }
    }
 })

 //>>> Delete Task
export const deleteTask = asyncHandler(async(req, res) => {
    const {taskId} = req.params
  
    if (req.user.accountType !== "Admin") {
      res.status(401);
      throw new Error({message: "User not authorized to perform this action"})
    }
  
    const task = await Task.findById({_id: taskId })
    
    if(!task) {
        res.status(400).json("Task does not exist or already deleted")
    } 
  
    const delTask = await Task.findByIdAndDelete(taskId)
  
    if (!delTask) {
      res.status(500);
      throw new Error({message: "Error Deleting Task"})
    }
  
    res.status(200).json("Task Deleted successfully")
  })


