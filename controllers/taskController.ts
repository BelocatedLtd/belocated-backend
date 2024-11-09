import { v2 as cloudinary } from 'cloudinary'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Advert from '../model/Advert'
import Task from '../model/Task'
import User from '../model/User'
import Wallet from '../model/Wallet'
import sendEMail from '../utils/sendEmail'
import { ObjectId } from 'mongodb';

// import cloudinary from "../utils/cloudinary";
//import { fileSizeFormatter } from "../utils/fileUpload";
//import {uploadMultipleImages} from '../utils/cloudinary'

//Create New Task
// http://localhost:6001/api/tasks/create
export const CreateNewTask = asyncHandler(
	async (req: Request, res: Response) => {
		const {
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
			adMedia,
		} = req.body
	  // Check if the task has already been performed by the user
	 const existingTask = await Task.findOne({ advertId:advertId, taskPerformerId: taskPerformerId });
  
		if (existingTask) {
		   res.status(400).json({ message: 'Task already performed. Please select another task.' });
		}
		const advert = await Advert.findById(advertId)

		if (!advert) {
			res
				.status(404)
				.json({ message: 'The advert for this task could not be found' })
			throw new Error('The advert for this task could not be found')
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
				public_id: '',
				url: '',
			},
			nameOnSocialPlatform: '',
			adMedia,
			status: 'Awaiting Submission',
		})

		if (!task) {
			res
				.status(500)
				.json({ message: 'Failed to add user to perform this task' })
			throw new Error('Failed to add user to perform this task')
		}

		if (task) {
			res.status(201).json(task)
		}
	},
)


//Get user Tasks
// http://localhost:6001/api/tasks/task
export const getTask = asyncHandler(async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 10 } = req.query

		console.log('🚀 ~ getTask ~ req.user._id:', req.user._id.toString())
		const tasks = await Task.find({
			taskPerformerId: req.user._id.toString(),
		})
			.sort('-createdAt')
			.skip((Number(page) - 1) * Number(limit))
			.limit(Number(limit))

		const totalTasks = await Task.countDocuments({
			taskPerformerId: req.user._id.toString(),
		})
		const totalPages = Math.ceil(totalTasks / Number(limit))

		if (!tasks || tasks.length === 0) {
			res.status(400).json({ message: 'Cannot find task' })
			return
		}

		res.status(200).json({
			tasks,
			totalTasks,
			totalPages,
			currentPage: Number(page),
		})
	} catch (error) {
		res.status(500).json({ error })
	}
})

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		const thisId = new mongoose.Types.ObjectId(id);

		const tasks = await Task.findById({ _id: thisId })
			.populate({
				path: 'advertId', // Populate advert document
				populate: {
					path: 'userId', // Nested populate for advertiser details
					model: 'User',
					select: 'fullname', // Get advertiser fullname
				},
			})
			.populate({
				path: 'taskPerformerId', // Populate task performer details
				select: 'username fullname', // Fetch both username and fullname
			});

		if (!tasks) {
			console.error('Task not found!');
		} else {
			// Restructure the response object
			const taskWithRenamedAdvert = {
				...tasks.toObject(), // Convert to plain object
				advert: tasks.advertId, // Rename and include the advert object
				taskPerformer: tasks.taskPerformerId, // Add task performer details
			};

			console.log('Advertiser Fullname:', taskWithRenamedAdvert.advert.userId.fullname);
			console.log('Task Performer Username:', taskWithRenamedAdvert.taskPerformer.username);
			console.log('Task Performer Fullname:', taskWithRenamedAdvert.taskPerformer.fullname);

			res.status(200).json(taskWithRenamedAdvert);// Return the restructured object if needed
		}
    } catch (error) {
	res.status(500).json({ error });
}
});

//Get user Tasks
// http://localhost:6001/api/tasks
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
	const { _id } = req.user as { _id: string };
	let tasks;
  
	if (req.user.accountType !== 'Admin') {
	  tasks = await Task.find({ taskPerformerId: _id, status:"Submitted" })
		.sort('-createdAt')
		.populate({
		  path: 'taskPerformerId',
		  select: 'username email', // Fetch only the username and email
		});
	}
  
	if (req.user.accountType === 'Admin') {
		tasks = await Task.find({ status:"Submitted" })
		  .populate({
			path: 'taskPerformerId',
			select: 'username email', // Fetch only the username and email
		  })
		  .populate('advertiserId')
		  .populate('advertId');
	  
  
	  const totalTasks = await Task.countDocuments({status:"Submitted"}
	  );
	  if (!tasks || tasks.length === 0) {
		res.status(400).json({ message: 'Cannot find any task' });
		return;
	  }
  
	  res.status(200).json({
		tasks,
		totalTasks,
	  });
	  return;
	}
  
	if (tasks) {
	  res.status(200).json(tasks);
	  return;
	}
  });
export const getTasksByUserId = asyncHandler(
	async (req: Request, res: Response) => {
		const { userId } = req.params

		const { page = 1, limit = 10, status = 'All' } = req.query
		let tasks
		if (status === 'All') {
			tasks = await Task.find({ taskPerformerId: userId })
				.skip((Number(page) - 1) * Number(limit))
				.limit(Number(limit))
				.sort('-createdAt')
				.populate('advertiserId')
				.populate('taskPerformerId')
				.populate('advertId')
		} else {
			tasks = await Task.find({ taskPerformerId: userId, status })
				.skip((Number(page) - 1) * Number(limit))
				.limit(Number(limit))
				.sort('-createdAt')
				.populate('advertiserId')
				.populate('taskPerformerId')
				.populate('advertId')
		}

		const totalTasks = await Task.countDocuments({ taskPerformerId: userId })
		const totalPages = Math.ceil(totalTasks / Number(limit))

		if (!tasks || tasks.length === 0) {
			res.status(400).json({ message: 'Cannot find any task' })
			return
		}

		res.status(200).json({
			tasks,
			totalTasks,
			totalPages,
			currentPage: Number(page),
		})
	},
)

export const getTasksByAdvertId = asyncHandler(
	async (req: Request, res: Response) => {
		const { advertId } = req.params
		const advertObjectId = advertId
	
			const tasks = await Task.find({
				advertId: advertObjectId,
				status:'Submitted'
			})
				.sort('-createdAt')
				.populate('advertiserId')
				.populate('taskPerformerId')
	

		const totalTasks = await Task.countDocuments({ advertId: advertObjectId, status:'Submitted' })
		console.log('🚀 ~ totalTasks:', totalTasks)
		

		if (!tasks || tasks.length === 0) {
			res.status(400).json({ message: 'Cannot find any task' })
			return
		}

		res.status(200).json({
			tasks,
			totalTasks,
			
		})
	},
)

// Submit Task
// http://localhost:6001/api/tasks/submit
export const submitTask = asyncHandler(async (req, res) => { 
  try {
    const { taskId, userSocialName } = req.body;

    // Get task, advert, user, and wallet details
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Cannot find task' });
    }

    const advert = await Advert.findById(task.advertId);
    if (!advert) {
      return res.status(404).json({ message: 'Cannot find advert' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Cannot find user' });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Cannot find user Wallet to update' });
    }

    // Check if the ad campaign is still active
    if (advert.desiredROI === 0) {
      return res.status(400).json({ message: 'Ad campaign is no longer active' });
    }

    // Check if the task has already been submitted
    if (task.status === 'Submitted') {
      return res.status(400).json({ 
        message: 'You have already submitted this task. Please wait for approval.'
      });
    }

    // Cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Upload screenshots if provided
    let uploadedImages = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'Task Submit Screenshots',
        });
        uploadedImages.push({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // Update task with submission details
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        nameOnSocialPlatform: userSocialName || task.nameOnSocialPlatform,
        proofOfWorkMediaURL: uploadedImages,
        status: 'Submitted',
      },
      { new: true, runValidators: true }
    );

    // Calculate the start of the current week (Sunday 12pm)
    const startOfWeek = new Date();
    startOfWeek.setHours(12, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Count approved tasks for the current week
    const approvedTasksThisWeek = await Task.countDocuments({
      taskPerformerId: req.user._id,
      status: 'Approved',
      createdAt: { $gte: startOfWeek, $lte: new Date() },
    });

    // Determine if this task should be free (4th or 9th task of the week)
    let isFreeTask = false;
    if ([4, 9].includes(approvedTasksThisWeek + 1)) {
      // Check if user has completed their two free tasks for the week
      const freeTasksThisWeek = await Task.countDocuments({
        taskPerformerId: req.user._id,
        isFreeTask: true,
        status: 'Approved',
        createdAt: { $gte: startOfWeek, $lte: new Date() },
      });

      // Only mark as free if less than two free tasks are completed
      if (freeTasksThisWeek < 2) {
        isFreeTask = true;
      }
    }

    if (isFreeTask) {
      // Mark task as free
      await Task.findByIdAndUpdate(taskId, { isFreeTask: true }, { new: true });

      // Decrement user's free task count
      user.freeTaskCount -= 1;
      await user.save();

      return res.status(200).json({ 
        message: 'Task submitted as a free task, awaiting admin approval.' 
      });
    } else {
      // Add earnings to user's pending balance for a paid task
      const updatedUserWallet = await Wallet.updateOne(
        { userId: req.user._id },
        { $inc: { pendingBalance: task.toEarn } }
      );

      if (!updatedUserWallet) {
        throw new Error('Failed to update user pending balance');
      }

      return res.status(200).json({ 
        message: 'Task submitted successfully, awaiting admin approval.' 
      });
    }

    // Decrease advert's desired ROI and increment task count
    advert.desiredROI -= 1;
    advert.tasks += 1;
    await advert.save();

    if (advert.desiredROI === 0) {
      advert.status = 'Completed';
      await advert.save();
    }
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ message: error.message || 'An unknown error occurred' });
  }
});


// Admin Approve Submitted Tasks and Pay user
export const approveTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId, status, message } = req.body

		const task = await Task.findById(new ObjectId(taskId))
console.log(task)
	if (!task) {
		throw new Error('Cannot find task')
	}

	const userIdString = req.user._id.toString()

	//Check if user is an admin
	if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin' &&
		userIdString !== task.advertiserId
	) {
		throw new Error('User Not Authorized')
	}

	//const task = await Task.findById(taskId)
	const advert = await Advert.findById(task?.advertId)
	const taskPerformer = await User.findById(task?.taskPerformerId)
	const wallet = await Wallet.findOne({ userId: task?.taskPerformerId })
	const advertiser = await User.findById(task.advertiserId)
	const advertserWallet = await Wallet.findOne({ userId: task?.advertiserId })

	if (!task) {
		throw new Error('Cannot find task')
	}

	if (task.status === 'Approved') {
		throw new Error(
			'This task has already being approved, you can only be paid once for an approved Task, please perform another task',
		)
	}

	if (!wallet) {
		throw new Error('Cannot find user Wallet for payment')
	}

	if (!taskPerformer) {
		throw new Error('Cannot find task performer details')
	}

	if (!advertserWallet) {
		throw new Error('Cannot find user Wallet Advertisers for payment retrieval')
	}

	if (!advertiser) {
		throw new Error('Cannot find Advertiser')
	}

	if (!advert) {
		throw new Error('Cannot find the ad for this task')
	}

	// Check if admin is the moderator asigned to the advert for this task
	//Check if user is an admin
	// if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
	//     res.status(400).json({message: "You are not assigned to moderate this task"});
	//     throw new Error("You are not assigned to moderate this task")
	// }

	// if (advert.desiredROI === 0) {
	// 	throw new Error('Ad campaign is no longer running')
	// }

	let updatedTask

	if (status === 'Partial Approval') {
		//Update task status after user submit screenshot
		task.status = status
		task.message = message

		//save the update on task model
		updatedTask = await task.save()
	}

	if (status === 'Approved') {
		//Update task status after user submit screenshot
		task.status = 'Approved'

		//save the update on task model
		updatedTask = await task.save()
	}

	if (!updatedTask) {
		throw new Error('Failed to approve task')
	}

	// When advert is a paid advert. Payment should be approved
	if (advert.isFree === false) {
		// Update Task performer's Wallets
		wallet.pendingBalance -= task.toEarn
		wallet.value += task.toEarn
		wallet.totalEarning += task.toEarn

		//save the update on user wallet
		const updatedTaskPerformerWallet = await wallet.save()

		if (!updatedTaskPerformerWallet) {
			throw new Error('Failed to update user wallet')
		}
	}

	// When advert is free
	// User freetask count should be subtracted by 1 and if its zero, an email should be sent.
	if (advert.isFree === true) {
		//User has completed the free task count for the week - Send email to the user
		if (taskPerformer.freeTaskCount === 0 && status === 'Approved') {
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
			const reply_to = 'noreply@noreply.com'

			//Finally sending email
			const emailSent = await sendEMail(subject, message, send_to, reply_to)

			if (!emailSent) {
				res.status(500).json('Email sending failed')
				throw new Error('Email sending failed')
			}
		}
	}

	//Update the list of taskperformers.
	advert.taskPerformers.push(taskPerformer._id)

	await advert.save()

	res.status(200).json(updatedTask)
})

// Admin Reject Submitted Tasks and Pay user
export const rejectTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId, message } = req.body

	//Check if user is an admin
	if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin'
	) {
		throw new Error('User Not Authorized')
	}

	const task = await Task.findById(taskId)

	if (!task) {
		throw new Error('Cannot find task')
	}

	const advert = await Advert.findById(task.advertId)
	const wallet = await Wallet.findOne({ userId: task.taskPerformerId })
	const taskPerformer = await User.findById(task.taskPerformerId)
	const advertserWallet = await Wallet.find({ userId: task.advertiserId })

	if (!task) {
		throw new Error('Cannot find task')
	}

	if (task.status === 'Rejected') {
		throw new Error(
			'This task has already being rejected, read the admins message and follow the instructions',
		)
	}

	if (task.status === 'Approved') {
		throw new Error(
			'This task has already being approved, to avoid double payments and confusion to the system, you cant reject and already approved task. Contact Admin',
		)
	}

	if (!wallet) {
		throw new Error('Cannot find user Wallet')
	}

	if (!taskPerformer) {
		throw new Error('Cannot find task performer details')
	}

	if (!advertserWallet) {
		throw new Error('Cannot find user Wallet Advertisers for payment retrieval')
	}

	if (!advert) {
		throw new Error('Cannot find user Wallet to update')
	}

	// Check if admin is the moderator asigned to the advert for this task
	//Check if user is an admin
	if (advert.tasksModerator && req.user._id !== advert.tasksModerator) {
		throw new Error('You are not assigned to moderate this task')
	}

	if (advert.desiredROI === 0) {
		throw new Error('Ad campaign is no longer active')
	}

	//Update task status after user submit screenshot
	task.status = 'Rejected'
	task.message = message

	//save the update on task model
	const updatedTask = await task.save()

	if (!updatedTask) {
		throw new Error('Failed to approve task')
	}

	if (advert.isFree === true) {
		taskPerformer.freeTaskCount += 1

		//save the update on user model
		const addFreeTaskCount = await taskPerformer.save()

		if (!addFreeTaskCount) {
			throw new Error('Failed to return rejected free task count')
		}
	}

	// Subtract Task performer's Wallets

	// Update the pendingBalance
	wallet.pendingBalance -= task.toEarn

	//save subtracted user wallet
	const walletSubUpdate = await wallet.save()

	if (!walletSubUpdate) {
		res
			.status(500)
			.json({ message: 'Failed to subtract user pending balance wallet' })
		throw new Error('Failed to update user wallet')
	}

	// Whether free task or paid task
	// desiredROI for the advert should be added back by 1, ad status should be changed to Running
	//Add 1 back to the desired roi
	//Subtract the number of tasks completed on an advert
	advert.desiredROI += 1
	advert.tasks -= 1
	advert.status = 'Running'

	//save the update on user model
	const updatedAdvert = await advert.save()

	if (!updatedAdvert) {
		throw new Error('Failed to failed task')
	}

	res.status(400).json(task)
})

export const getAllSubmittedTask = asyncHandler(async (req: Request, res: Response) => {
	try {
        const submittedTask = await Task.countDocuments({
			status: 'Submitted',
		});
		res.json({	
			submittedTask,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error fetching tasks' });
	}
});

//>>> Delete Task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId } = req.params

	if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin'
	) {
		res
			.status(401)
			.json({ message: 'User not authorized to perform this action' })
		throw new Error('User not authorized to perform this action')
	}

	const task = await Task.findById({ _id: taskId })

	if (!task) {
		res.status(400).json('Task does not exist or already deleted')
	}

	const delTask = await Task.findByIdAndDelete(taskId)

	if (!delTask) {
		res.status(500).json({ message: 'Error Deleting Task' })
		throw new Error('Error Deleting Task')
	}

	res.status(200).json('Task Deleted successfully')
})
export const remainingApprovedTasks = asyncHandler(async (req: Request, res: Response) => {
	const { _id, location, community, gender } = req.user
        const { userId } = req.params;

    try {
        // Fetch the total tasks from DB
       	const totalTasks = await Advert.countDocuments({
			status:'Running',
		$and: [
				{ $or: [{ state: location }, { state: 'All' }] },
				{ $or: [{ lga: community }, { lga: 'All' }] },
				{ $or: [{ gender: gender }, { gender: 'All' }] },
			  ],
		});
console.log(totalTasks);
        // Fetch the number of tasks the user has completed (status = 'Approved')
        const approvedTasks = await Task.countDocuments({
            taskPerformerId: userId,
            status: 'Approved',
        });
	    
	const completedTasks = await Task.countDocuments({
            taskPerformerId: userId,
            status:'Submitted',
        });
	    const remp = completedTasks + approvedTasks;

        // Return the remaining task count
        res.json({
            totalTasks,
            approvedTasks,
             remainingTaskstoApprove: remp - approvedTasks,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

export const remainingCompletedTask = asyncHandler(async (req: Request, res: Response) => {
	const { _id, location, community, gender } = req.user
    const { userId } = req.params;

    try {
        // Fetch the total tasks from DB
      	const totalTasks = await Advert.countDocuments({
			status:'Running',
		$and: [
				{ $or: [{ state: location }, { state: 'All' }] },
				{ $or: [{ lga: community }, { lga: 'All' }] },
				{ $or: [{ gender: gender }, { gender: 'All' }] },
			  ],
		});
console.log(totalTasks);

const approvedTasks = await Task.countDocuments({
            taskPerformerId: userId,
            status: 'Approved',
        });
	    
        // Fetch the number of tasks the user has completed (status = 'Approved')
        const completedTasks = await Task.countDocuments({
            taskPerformerId: userId,
             status:'Submitted',
        });

	    const recmp = approvedTasks + completedTasks;

        // Return the remaining task count
        res.json({
           totalTasks,
           completedTasks,
           remainingTaskToComplete: totalTasks - recmp,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Controller to get remaining tasks for a specific user on a specific platform
export const getRemainingTasksByPlatform = asyncHandler(
	async (req: Request, res: Response) => {
	  const { userId, platform } = req.params; // Extract userId and platform from request parameters
  
	  try {
		// Fetch completed task IDs by the user on the specified platform
		const completedTasks = await Task.find({
		  taskPerformerId: userId,
		  platform,
		}).select('advertId'); // Select only the advertId field
  
		// Extract completed task IDs into an array
		const completedTaskIds = completedTasks.map(task => task.advertId);
  
		// Fetch total tasks for the specified platform that are not completed by the user
		const remainingTasks = await Task.countDocuments({
		  platform,
		  advertId: { $nin: completedTaskIds }, // Exclude completed tasks
		});
  
		res.status(200).json({ platform, remainingTasks });
	  } catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error fetching remaining tasks' });
	  }
	}
  );
	  export const checkRemainingTask = asyncHandler(async (req: Request, res: Response) => {
	const { advertId, performerId } = req.params;
  
	try {
	  // Find the task with matching advertId, performerId, and relevant status
	  const existingTask = await Task.findOne({
		advertId,
		taskPerformerId: performerId,
		status: { $in: ['Submitted', 'Completed', 'Approved'] },
	  });
  
	  // Respond based on whether the task was found
	  res.status(200).json({ exists: !!existingTask });
	} catch (error) {
	  console.error('Error checking existing task:', error);
	  res.status(500).json({ message: 'Server error' });
	}
  });
