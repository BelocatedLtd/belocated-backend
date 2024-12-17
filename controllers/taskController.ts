import { v2 as cloudinary } from 'cloudinary'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Advert from '../model/Advert'
import Task from '../model/Task'
import User from '../model/User'
import Wallet from '../model/Wallet'
import sendEmail from '../utils/sendEmail'
import { ObjectId } from 'mongodb';
import  { io } from '../app'

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


export const submitTask = asyncHandler(
	async (req: Request, res: Response) => {
  try {
    const { taskId, userSocialName } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Cannot find task' });
      return;
    }

    const advert = await Advert.findById(task.advertId);
    if (!advert) {
      res.status(404).json({ message: 'Cannot find advert' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'Cannot find user' });
      return;
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      res.status(404).json({ message: 'Cannot find user Wallet to update' });
      return;
    }

    if (advert.desiredROI === 0) {
      res.status(400).json({ message: 'Ad campaign is no longer active' });
      return;
    }

    if (task.status === 'Submitted') {
      res.status(400).json({
        message: 'You have already submitted this task. Please wait for approval.'
      });
      return;
    }
	  	// Cloudinary configuration
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
		})


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

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        nameOnSocialPlatform: userSocialName || task.nameOnSocialPlatform,
        proofOfWorkMediaURL: uploadedImages,
        status: 'Submitted',
      },
      { new: true, runValidators: true }
    );

    const startOfWeek = new Date();
    startOfWeek.setHours(12, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const approvedTasksThisWeek = await Task.countDocuments({
      taskPerformerId: req.user._id,
      status: 'Approved',
      createdAt: { $gte: startOfWeek, $lte: new Date() },
    });

    let isFreeTask = false;
    if ([4, 9].includes(approvedTasksThisWeek + 1)) {
      const freeTasksThisWeek = await Task.countDocuments({
        taskPerformerId: req.user._id,
        isFreeTask: true,
        status: 'Approved',
        createdAt: { $gte: startOfWeek, $lte: new Date() },
      });

      if (freeTasksThisWeek < 2) {
        isFreeTask = true;
      }
    }

    if (isFreeTask) {
      await Task.findByIdAndUpdate(taskId, { isFreeTask: true }, { new: true });

      user.freeTaskCount -= 1;
      await user.save();

      res.status(200).json({ message: 'Task submitted as a free task, awaiting admin approval.' });
    } else {
      const updatedUserWallet = await Wallet.updateOne(
        { userId: req.user._id },
        { $inc: { pendingBalance: task.toEarn } }
      );

      if (!updatedUserWallet) {
        throw new Error('Failed to update user pending balance');
      }

      res.status(200).json({ message: 'Task submitted successfully, awaiting admin approval.' });
    }

    advert.desiredROI -= 1;
    advert.tasks += 1;
    await advert.save();

    if (advert.desiredROI === 0) {
      advert.status = 'Completed';
      await advert.save();
    }
} catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error submitting task:', error.message);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Unknown error submitting task:', error);
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});


// Admin Approve Submitted Tasks and Pay user
export const approveTask = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, status, message } = req.body;

    if (!taskId || !status) {
        res.status(400);
        throw new Error('Task ID and status are required.');
    }

    const task = await Task.findById(taskId);
    if (!task) {
        res.status(404).json({message:'Task not found'});
        return;
    }

    const userIdString = req.user._id.toString();

    if (
        req.user.accountType !== 'Admin' &&
        req.user.accountType !== 'Super Admin' &&
        userIdString !== task.advertiserId
    ) {
        res.status(403).json({message:'User not authorized'});
        return;
    }   
    const advert = await Advert.findById(task.advertId);
    const taskPerformer = await User.findById(task.taskPerformerId);
    const wallet = await Wallet.findOne({ userId: task.taskPerformerId });

    if (!advert || !taskPerformer || !wallet) {
        res.status(500).json({message: 'Failed to retrieve necessary data for task approval.'});
        return;
    }

    if (task.status === 'Approved') {
        res.status(400).json({message:'Task already been approved'}) 
        return;
    }

    try {
        task.status = status;
        task.message = message;
        await task.save();
    } catch (error) {
        console.error('Task Save Error:', error);
        res.status(500).json({message:'Failed to save task'});
        return;
    }

    if (advert.isFree === false) {
        try {
            wallet.pendingBalance -= task.toEarn;
            wallet.value += task.toEarn;
            wallet.totalEarning += task.toEarn;

            if (wallet.pendingBalance < 0) {
                res.status(500).json({message:'wallet balance inconsistency detected'});
                return;
            }
            await wallet.save();
        } catch (error) {
            console.error('Wallet Save Error:', error);
            res.status(500).json({message:'Failed to update wallet'});
            return;
        }
    } else if (advert.isFree === true && taskPerformer.freeTaskCount === 0) {
        try {
            const emailMessage = `
                <h2>Congratulations ${taskPerformer?.username}!</h2>
                <p>You have completed your free tasks for this week.</p>`;
            await sendEmail(
                'Free Task Completed!',
                emailMessage,
                taskPerformer.email,
                'noreply@noreply.com',
            );
        } catch (error) {
            console.error('Email Sending Error:', error);
            res.status(500).json({message:'Faied to send email'});
            return;
        }
    }
try {
      if (status === 'Approved') {
	io.emit('taskNotification', {
		message: `Task has been ${status.toLowerCase()}!`,
	});
}

    } catch (error) {
        console.error('WebSocket Emit Error:', error);
    }
	

    try {
        advert.taskPerformers.push(taskPerformer._id);
        await advert.save();
    } catch (error) {
        console.error('Advert Save Error:', error);
        res.status(500).json({message:'Failed to update advert.'});
        return;
    }

    

    res.status(200).json(task);
});

// Admin Reject Submitted Tasks and Pay user
export const rejectTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId, message } = req.body;

	// Ensure user is an admin
	if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin'
	) {
		throw new Error('User Not Authorized');
	}

	// Fetch task
	const task = await Task.findOne(taskId);
	if (!task) {
		throw new Error('Cannot find task');
	}

	// Fetch related data
	if (!task.advertId || !task.taskPerformerId || !task.advertiserId) {
		throw new Error('Task is missing necessary references');
	}

	const advert = await Advert.findOne(task.advertId);
	const wallet = await Wallet.findOne({ userId: task.taskPerformerId });
	const taskPerformer = await User.findOne(task.taskPerformerId);
	const advertiserWallet = await Wallet.findOne({ userId: task.advertiserId });

	// Check for missing data
	if (!advert || !wallet || !taskPerformer || !advertiserWallet) {
		throw new Error('Required related data not found');
	}

	// Task status checks
	if (task.status === 'Rejected') {
		throw new Error('This task has already been rejected.');
	}
	if (task.status === 'Approved') {
		throw new Error('Cannot reject an already approved task.');
	}

	// Moderator check
	if (advert.tasksModerator && req.user._id.toString() !== advert.tasksModerator.toString()) {
		throw new Error('You are not assigned to moderate this task');
	}

	if (advert.desiredROI === 0) {
		throw new Error('Ad campaign is no longer active');
	}

	// Update task status
	task.status = 'Rejected';
	task.message = message;
	await task.save();

	// Handle free tasks
	if (advert.isFree === true) {
		taskPerformer.freeTaskCount += 1;
		await taskPerformer.save();
	}

	// Update wallet and advert
	wallet.pendingBalance -= task.toEarn || 0;
	await wallet.save();

	advert.desiredROI = Math.max(0, advert.desiredROI + 1);
	advert.tasks = Math.max(0, advert.tasks - 1);
	advert.status = 'Running';
	await advert.save();

	// Respond with updated task
	res.status(200).json(task);
});
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
