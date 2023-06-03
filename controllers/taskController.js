import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Advert from "../model/Advert.js";
import Task from '../model/Task.js'
import Wallet from "../model/Wallet.js";
import { v2 as cloudinary } from 'cloudinary'
//import cloudinary from "../utils/cloudinary.js";



//Create New Task
// http://localhost:6001/api/tasks/create
export const CreateNewTask = asyncHandler(async (req, res) => {
    const { advertId, advertiserId, taskPerformerId, title, platform, asset, desiredROI, toEarn, gender, location, community, religion, caption, socialPageLink } = req.body;

    //Create New Task
    const task = await Task.create({
        advertId,
        advertiserId, 
        taskPerformerId, 
        title,
        platform, 
        asset, 
        desiredROI, 
        toEarn,
        gender, 
        location,
        community,
        religion, 
        caption, 
        socialPageLink,
        proofOfWorkMediaURL: {
            public_id: "",
            url: "",
        },
        nameOnSocialPlatform: '',
        status: "running"
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
    const { taskId } = req.body
    try {
          const task = await Task.find({_id: taskId})
         if(!task) {
             res.status(400).json({ msg: "Cannot find task" })
             throw new Error("Cannot find task")
         } 
         
         if (task) {
           res.status(200).json(task)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
     }
  })


 //Get user Tasks
 // http://localhost:6001/api/tasks
export const  getTasks = asyncHandler(async (req, res) => {
    const { _id } = req.user

    try {
        let tasks;
        
        tasks = await Task.find().sort("-createdAt")

        if(!tasks) {
            res.status(400).json({ msg: "Cannot find any task" })
            throw new error("Cannot find any task")
        } 
         
         if (tasks) {
           res.status(200).json(tasks)
        }
     } catch (error) {
         res.status(500).json({error: error.message});
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
    const {taskId, advertId, advertiserId, taskPerformerId, taskStatus, adStatus } = req.body

    if (req.user.accountType !== "Admin") {
        res.status(400).json({msg: "User Not Authorized"});
        throw new Error("User Not Authorized")
    }

    const task = await Task.findById(taskId)
    const advert = await Advert.findById(advertId)
    const wallet = await Wallet.find({userId: taskPerformerId})
    const advertserWallet = await Wallet.find({userId: advertiserId})

    if (!task) {
        res.status(400).json({msg: "Cannot find task"});
        throw new Error("Cannot find task")
    }

    if (task.status === "Approved") {
        res.status(400).json({msg: "This task has already being approved, you can only be paid once for an approved Task, please perform another task"});
        throw new Error("This task has already being approved, you can only be paid once for an approved Task, please perform another task")
    }

    if (!wallet) {
        res.status(400).json({msg: "Cannot find user Wallet for payment"});
        throw new Error("Cannot find user Wallet for payment")
    }

    if (!advertserWallet) {
        res.status(400).json({msg: "Cannot find Advertisers Wallet for payment retrieval"});
        throw new Error("Cannot find user Wallet Advertisers for payment retrieval")
    }

    if (!advert) {
        res.status(400).json({msg: "Cannot find the ad for this task"});
        throw new Error("Cannot find user Wallet to update")
    }

    //Update task after user submit screenshot
    const updatedTask = await Task.findByIdAndUpdate(
        { _id: taskId },
        {
            status: taskStatus || task.status,
          
        },
        {
            new: true,
            runValidators: true
        }
    )

    //Update Advert after user admin Approves Task Submittion
    const updatedAdvertStatus = await Advert.findByIdAndUpdate(
        { _id: advertId },
        {
            status: adStatus || advert.status,
          
        },
        {
            new: true,
            runValidators: true
        }
    )

    const updatedAdvertDesiredROI = await Advert.findByIdAndUpdate(
        { _id: advertId },
        {
            $inc: {desiredROI: -1}
        },
        {
            new: true,
            runValidators: true
        }
    )

        const updatedAdvertTasksCount = await Advert.findByIdAndUpdate(
            { _id: advertId },
            {
                $inc: {tasks: 1}
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!updatedTask || !updatedAdvertStatus || !updatedAdvertDesiredROI || !updatedAdvertTasksCount) {
            res.status(400).json({msg: "Error, Task could not be Approved"});
            throw new Error("Error, Task could not be Approved")
        }

    // Update Task performer's Wallets
    if (updatedTask && updatedAdvertStatus && updatedAdvertDesiredROI && updatedAdvertTasksCount) {

        //Update Task Performer's Wallet
        const updatedUserPendingBalance = await Wallet.updateOne(
            { userId:  taskPerformerId},
            {
                $inc: {pendingBalance: -task.toEarn}
            },
            {
                new: true,
                runValidators: true
            }
        )

        const updatedUserMainWallet = await Wallet.updateOne(
            { userId:  taskPerformerId},
            {
                $inc: {value: task.toEarn}
            },
            {
                new: true,
                runValidators: true
            }
        )

        const updatedUserTotalEarnings = await Wallet.updateOne(
            { userId:  taskPerformerId},
            {
                $inc: {totalEarning: task.toEarn}
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!updatedUserPendingBalance || !updatedUserMainWallet || !updatedUserTotalEarnings) {
            res.status(400).json({msg: "failed to update user wallet balance"});
            throw new Error("failed to update user wallet balance")
        }
    
        if (updatedUserPendingBalance && updatedUserMainWallet && updatedUserTotalEarnings) {
            const updatedTaskFinal = await Task.findById(taskId)
            res.status(200).json(updatedTaskFinal);
        }
    }
 })


