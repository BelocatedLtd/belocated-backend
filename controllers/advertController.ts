import { v2 as cloudinary } from 'cloudinary'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
const { Types } = mongoose; 
import { IAdvert } from '../@types/types'
import Advert from '../model/Advert'
import Task from '../model/Task'
import Transaction from '../model/Transaction'
import User from '../model/User'
import Wallet from '../model/Wallet'

//Create New Advert
// http://localhost:6001/api/advert/create
export const createAdvert = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			userId,
			platform,
			service,
			adTitle,
			TD,
			desiredROI,
			costPerTask,
			earnPerTask,
			gender,
			state,
			lga,
			caption,
			adAmount,
			socialPageLink,
			paymentMethod,
			paymentRef,
		} = req.body
console.log(req.body);
		// Validation
		if (
			!platform ||
			!service ||
			!adTitle ||
			!TD ||
			!desiredROI ||
			!costPerTask ||
			!earnPerTask ||
			!gender ||
			!state ||
			!lga ||
			!adAmount ||
			!paymentMethod ||
			!paymentRef
		) {
			res
				.status(400)
				.json({ message: 'Please fill in all the required fields' })
			throw new Error('Please fill in all fields')
		}

		const admins = await User.find({ accountType: 'Admin' })

		if (!admins) {
			res.status(500).json({ message: 'No admin found' })
			throw new Error('No admin found')
		}

		try {
			// Getting user wallet
			const wallet = await Wallet.findOne({ userId: req.user._id })
			if (!wallet) {
				res.status(400).json({ message: 'Wallet not found' })
				throw new Error('Wallet not found')
			}

			// Checking if user wallet is sufficient to fund ad purchase
			if (wallet.value < adAmount) {
				res.status(400).json({
					message: 'Wallet insufficient to pay for ad, please fund wallet',
				})
				throw new Error('Wallet insufficient to pay for ad, please fund wallet')
			}

			//Cloudinary configuration
			// Return "https" URLs by setting secure: true
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_NAME,
				api_key: process.env.CLOUDINARY_API_KEY,
				api_secret: process.env.CLOUDINARY_API_SECRET,
			})

			//Upload screenshots to databse
			let uploadedImages = []

			if (req.files) {
				try {
					const files = Array.isArray(req.files)
						? req.files
						: Object.values(req.files).flat()
					for (const file of files) {
						const result = await cloudinary.uploader.upload(file.path, {
							resource_type: 'auto',
							folder: 'Advert Media Contents',
						})

						uploadedImages.push({
							secure_url: result.secure_url,
							public_id: result.public_id,
						})
					}
				} catch (error) {
					console.error(error)
					res.status(500).json({ message: 'Error uploading images' })
				}
			}

			// Randomly pick an admin to moderate the tasks to be submitted for this advert.

			// Generate a random index within the range of the admins array length
			const randomIndex = Math.floor(Math.random() * admins.length)

			// Retrieve the admin object at the randomly generated index
			const selectedAdmin = admins[randomIndex]

			//After image has being uploaded to cloudinary - Now create advert

			//Create New Advert
			const advert = await Advert.create({
				userId,
				platform,
				service,
				adTitle,
				TD,
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
				status: 'Pending Payment',
			})

			if (!advert) {
				res
					.status(400)
					.json({ message: 'Advert wasnt created, please try again' })
				throw new Error('Advert wasnt created, please try again')
			}

			//When wallet value is sufficient and advert has being created, then you can go ahead and make payment
			if (wallet.value >= adAmount && advert) {
				// Update user wallet after payment made

				//Debit user main wallet
				const updatedUserWallet = await Wallet.updateOne(
					{ userId: req.user._id },
					{
						$inc: { value: -adAmount },
					},
					{
						new: true,
						runValidators: true,
					},
				)

				//Increase value of amount spent by user
				const updateAmountSpent = await Wallet.updateOne(
					{ userId: req.user._id },
					{
						$inc: { amountSpent: adAmount },
					},
					{
						new: true,
						runValidators: true,
					},
				)

				if (!updatedUserWallet || !updateAmountSpent) {
					res
						.status(400)
						.json({ message: 'Cannot access user wallet to make ad payment' })
					throw new Error('Cannot access user wallet to make ad payment')
				}

				if (updatedUserWallet && updateAmountSpent) {
					// Change Advert Status to Running && Create Transaction

					//Change advert status
					const updateAdStatus = await Advert.updateOne(
						{ _id: advert._id },
						{
							status: 'Running',
						},
						{
							new: true,
							runValidators: true,
						},
					)
					console.log('🚀 ~ updateAdStatus:', updateAdStatus)

					if (!updateAdStatus) {
						res
							.status(400)
							.json({ message: 'Failed to switch ad status to running' })
						throw new Error('Failed to switch ad status to running')
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
							paymentRef,
							trxType: 'advert_payment',
							status: 'Approved Successful',
							paymentMethod,
						})
						console.log('🚀 ~ advert:', { advert, transaction })

						if (!transaction) {
							res.status(400).json({ message: 'Failed to create transaction' })
							throw new Error('Failed to create transaction')
						}

						if (advert && transaction) {
							res.status(201).json(advert)
						}
					}
				}
			}
		} catch (error) {
			res.status(500).json({ error: error })
		}
	},
)

export const initializeAdvert = asyncHandler(
	async (req: Request, res: Response) => {
		console.log('🚀 ~ initializeAdvert ~ initializeAdvert:', initializeAdvert)

		try {
			const {
				userId,
				platform,
				service,
				adTitle,
				TD,
				desiredROI,
				costPerTask,
				earnPerTask,
				gender,
				state,
				lga,
				caption,
				adAmount,
				socialPageLink,
				paymentRef,
			} = req.body
			// Validation
			if (
				!platform ||
				!service ||
				!adTitle ||
				!TD ||
				!desiredROI ||
				!costPerTask ||
				!earnPerTask ||
				!gender ||
				!state ||
				!lga ||
				!adAmount ||
				!paymentRef
			) {
				res
					.status(400)
					.json({ message: 'Please fill in all the required fields' })
				throw new Error('Please fill in all fields')
			}

			const existingAdvert = await Advert.findOne({ paymentRef })
			if (existingAdvert) {
				res.status(400).json({
					message: 'An advert with this payment reference already exists!',
				})
				return
			}

			const admins = await User.find({ accountType: 'Admin' })

			if (!admins) {
				res.status(500).json({ message: 'No admin found' })
				throw new Error('No admin found')
			}

			// Randomly pick an admin to moderate the tasks to be submitted for this advert.
			const randomIndex = Math.floor(Math.random() * admins.length)
			const selectedAdmin = admins[randomIndex]
			console.log('🚀 ~ initializeAdvert ~ selectedAdmin:', selectedAdmin)

			//Cloudinary configuration
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_NAME,
				api_key: process.env.CLOUDINARY_API_KEY,
				api_secret: process.env.CLOUDINARY_API_SECRET,
			})

			// Upload screenshots to database
			let uploadedImages = []
			if (req.files && Array.isArray(req.files) && req.files.length > 0) {
				console.log('🚀 ~ initializeAdvert ~ files:', req.files)

				try {
					for (const file of req.files) {
						const result = await cloudinary.uploader.upload(file.path, {
							resource_type: 'auto',
							folder: 'Advert Media Contents',
						})

						uploadedImages.push({
							secure_url: result.secure_url,
							public_id: result.public_id,
						})
					}
				} catch (error) {
					console.error(error)
					res.status(500).json({ message: 'Error uploading images' })
					throw new Error('Error uploading images')
				}
			}

			// Create New Advert
			const advert = await Advert.create({
				userId,
				platform,
				service,
				adTitle,
				TD,
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
				status: 'Pending Payment',
				paymentRef,
			})
			console.log('🚀 ~ initializeAdvert ~ advert:', advert)

			if (!advert) {
				res
					.status(400)
					.json({ message: `Advert wasn't created, please try again` })
				throw new Error("Advert wasn't created, please try again")
			}

			res.status(200).json(advert)
		} catch (error) {
			res.status(500).json({ error: error })
		}
	},
)

//Change Advert Free Status
// http://localhost:6001/api/advert/create
export const toggleAdvertFreeStatus = asyncHandler(
	async (req: Request, res: Response) => {
		const { advertId } = req.body

		const advert = await Advert.findById(req.params.id)

		const user = await User.findById(req.user._id)

		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res.status(401).json({ message: 'Unauthorized User' })
			throw new Error('Unauthorized User')
		}

		if (!advert) {
			res.status(404).json({ message: 'Cannot find advert' })
			throw new Error('Failed to find Advert')
		}

		if (advert.isFree === false) {
			advert.isFree = true

			const toggleAdTypeFalseToTrue = advert.save()

			if (!toggleAdTypeFalseToTrue) {
				res.status(404).json({ message: 'Failed to change advert type' })
				throw new Error()
			}

			res.status(200).json(toggleAdTypeFalseToTrue)
			return
		}

		if (advert.isFree === true) {
			advert.isFree = false

			const toggleAdTypeTrueToFalse = advert.save()

			if (!toggleAdTypeTrueToFalse) {
				res.status(404).json({ message: 'Failed to change advert type' })
				throw new Error()
			}

			res.status(200).json(toggleAdTypeTrueToFalse)
			return
		}
	},
)

//Get user Advert
// http://localhost:6001/api/advert
export const getAdvert = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.user;
  console.log('🚀 ~ getAdvert ~ _id:', _id);

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const totalAdverts = await Advert.countDocuments({ userId: _id });

    const adverts = await Advert.find({ userId: _id })
      .skip(startIndex)
      .limit(limit)
      .sort('-createdAt');

    if (!adverts.length) {
     res.status(200).json({
        adverts: [],
        totalAdverts: 0,
        totalPages: 0,
        currentPage: page,
      });
	     return;
    }

    const advertsWithTasks = await Promise.all(
      adverts.map(async (advert) => {
        const taskSubmitters = await Task.find({
          advertId: advert._id.toString(),
          status: { $in: ['Completed', 'Approved', 'Submitted'] },
        }).populate('taskPerformerId', 'fullname username email');

        console.log('🚀 ~ taskSubmitters:', taskSubmitters);

        const validTaskSubmitters = taskSubmitters.map((submitter) => {
          if (typeof submitter.taskPerformerId === 'string') {
            submitter.taskPerformerId = new Types.ObjectId(submitter.taskPerformerId);
          }
          return submitter;
        });

        const completedTasksCount = await Task.countDocuments({
          advertId: advert._id.toString(),
          status: 'Approved',
        });

        return {
          ...advert.toObject(),
          taskSubmitters: validTaskSubmitters,
          completedTasksCount,
        };
      })
    );

    const totalPages = Math.ceil(totalAdverts / limit);

    res.status(200).json({
      adverts: advertsWithTasks,
      totalAdverts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('🚀 ~ Error fetching adverts:', error);
    res.status(500).json({ error });
  }
});

  
// Get All Advert
// http://localhost:6001/api/advert/all
export const getAllAdvert = asyncHandler(async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const currentPage = page || 1;
        const currentLimit = limit || 10;
        const startIndex = (currentPage - 1) * currentLimit;

        // Fetch all running adverts with pagination
        const adverts = await Advert.find({ status: "Running" })
            .sort('-createdAt')
            .skip(startIndex)
            .limit(currentLimit)
            .populate('userId', 'fullname email');

        const totalAdverts = await Advert.countDocuments({ status: "Running" });
        const totalPages = Math.ceil(totalAdverts / currentLimit);

        // Fetch approved and submitted tasks, group them by advertId
        const taskCounts = await Task.aggregate([
            {
                $match: {
                    status: { $in: ["Approved", "Submitted"] }
                }
            },
            {
                $group: {
                    _id: { advertId: "$advertId", status: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Organize task counts by advertId for easier lookup
        const taskCountMap = taskCounts.reduce((acc, { _id, count }) => {
            const { advertId, status } = _id;
            if (!acc[advertId]) acc[advertId] = { approvedTaskCount: 0, submittedTaskCount: 0 };
            if (status === "Approved") acc[advertId].approvedTaskCount = count;
            if (status === "Submitted") acc[advertId].submittedTaskCount = count;
            return acc;
        }, {});

        // Map the task counts to their respective adverts
        const advertsWithTaskCounts = adverts.map(advert => {
            const { approvedTaskCount = 0, submittedTaskCount = 0 } =
                taskCountMap[advert._id.toString()] || {};
            return {
                ...advert.toObject(),
                approvedTaskCount,
                submittedTaskCount
            };
        });

        res.status(200).json({
            adverts: advertsWithTaskCounts,
            page: currentPage,
            totalPages,
            totalAdverts,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        });
    } catch (error) {
        console.error('🚀 ~ error:', error);
        res.status(500).json({ error });
    }
});

//>>> Delete Advert
export const deleteAdvert = asyncHandler(
	async (req: Request, res: Response) => {
		const { advertId } = req.params

		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res
				.status(401)
				.json({ message: 'User not authorized to perform this action' })
			throw new Error('User not authorized to perform this action')
		}

		const advert = await Advert.findById({ _id: advertId })

		if (!advert) {
			res
				.status(400)
				.json({ message: 'Advert does not exist or already deleted' })
			throw new Error('Advert does not exist or already deleted')
		}

		const delAdvert = await Advert.findByIdAndDelete(advertId)

		if (!delAdvert) {
			res.status(500).json({ message: 'Error Deleting Advert' })
			throw new Error('Error Deleting Advert')
		}

		res.status(200).json('Advert Deleted successfully')
	},
)
export const getQualifiedAdverts = asyncHandler(
    async (req: Request, res: Response) => {
        const { _id, location, community, gender } = req.user;
        const { platformName } = req.params;

        try {
            // Fetch all adverts for the specified platform and apply user-based filters
            const adverts = await Advert.find({
                platform: platformName,
                status: 'Running',
                $and: [
                    { $or: [{ state: location }, { state: 'All' }] },
                    { $or: [{ lga: community }, { lga: 'All' }] },
                    { $or: [{ gender: gender }, { gender: 'All' }] },
                ],
            }).sort('-createdAt');

            if (!adverts.length) {
                throw new Error('No adverts found');
            }

            // Get the IDs of tasks the user has already performed on this platform
            const userTasks = await Task.find({
                taskPerformerId: _id?.toString(),
                platform: platformName,
                status: { $in: ['Submitted', 'Completed', 'Approved', 'Rejected'] },
            }).select('advertId');

            const completedTaskIds = new Set(userTasks.map(task => task.advertId?.toString() || ''));

            // Group adverts by service type with a count of available adverts per service type
            const advertsByServiceType: Record<
                string,
                { adverts: IAdvert[]; availableTasksCount: number }
            > = {};

            adverts.forEach((advert) => {
                const serviceType = advert.service || 'Undefined';

                if (!advertsByServiceType[serviceType]) {
                    advertsByServiceType[serviceType] = { adverts: [], availableTasksCount: 0 };
                }

                // Check if the advert has not been completed or submitted by the user
                const isAvailable = !completedTaskIds.has(advert._id.toString());

                if (isAvailable) {
                    advertsByServiceType[serviceType].adverts.push(advert as any);
                    advertsByServiceType[serviceType].availableTasksCount++;
                }
            });

            // Select one advert per service type and add the available tasks count for that service type
            const selectedAdverts = [];
            for (const serviceType in advertsByServiceType) {
                const { adverts: serviceAdverts, availableTasksCount } = advertsByServiceType[serviceType];

                if (serviceAdverts.length > 0) {
                    const selectedAdvert = {
                        ...serviceAdverts[0]._doc,
                        availableTasks: availableTasksCount,  // Count only for this specific service type
                    };
                    selectedAdverts.push(selectedAdvert);
                }
            }

            // Respond with the selected adverts including the task counts for each service type
            res.status(200).json(selectedAdverts);
        } catch (error) {
            res.status(500).json({ error });
        }
    },
);


// Handle task submission and prevent duplicate tasks
export const submitTask = asyncHandler (async (req: Request, res: Response) => {
	const { advertId, performerId } = req.body;
	// const { _id, location, community, gender } = req.user;
  
 try {
        // Check if the task has already been performed by the user
        const existingTask = await Task.findOne({ advertId, taskPerformerId: performerId }).exec();

        if (existingTask) {
           res.status(400).json({ message: 'Task already performed. Please select another task.' });
        }

        // If no existing task, you can proceed with task creation or other logic here
        res.status(200).json({ message: 'Task is available for performance.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while checking the task.' });
    }
});



// export const getTotalTasksByAllPlatforms = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const { _id, location, community, gender } = req.user

// 		try {
// 			const eligibleAdverts = await Advert.find({
// 				status: 'Running',
// 				$and: [
// 					{
// 						$or: [{ state: location }, { state: 'All' }],
// 					},
// 					{
// 						$or: [{ lga: community }, { lga: 'All' }],
// 					},
// 					{
// 						$or: [{ gender: gender }, { gender: 'All' }],
// 					},
// 				],
// 			}).sort('-createdAt')

// 			if (!eligibleAdverts.length) {
// 				res.status(200).json(null)
// 				return
// 			}

// 			const userTasks = await Task.find({ taskPerformerId: _id }).select(
// 				'advertId',
// 			)
// 			const userTaskAdvertIds = new Set(
// 				userTasks.map((task) => task.advertId?.toString() || ''),
// 			)

// 			const platformTaskCounts: Record<string, { totalTasks: number }> = {}

// 			eligibleAdverts.forEach((advert) => {
// 				if (!userTaskAdvertIds.has(advert._id.toString())) {
// 					const platformName = advert.platform

// 					if (!platformTaskCounts[platformName]) {
// 						platformTaskCounts[platformName] = { totalTasks: 0 }
// 					}

// 					platformTaskCounts[platformName].totalTasks++
// 				}
// 			})

// 			res.status(200).json(platformTaskCounts)
// 		} catch (error) {
// 			res.status(500).json({ error: error || 'Internal Server Error' })
// 		}
// 	},
// )

export const getTotalTasksByAllPlatforms = asyncHandler(async (req: Request, res: Response) => {
    const { _id, location, community, gender } = req.user;

    try {
        // Fetch eligible adverts based on user criteria
        const adverts = await Advert.find({
            status: 'Running',
            $and: [
                { $or: [{ state: location }, { state: 'All' }] },
                { $or: [{ lga: community }, { lga: 'All' }] },
                { $or: [{ gender: gender }, { gender: 'All' }] },
            ]
        }).sort('-createdAt');

        if (!adverts.length) {
             res.status(200).json({}); // No eligible adverts
        }

        // Fetch user's completed tasks across all platforms
        const userTasks = await Task.find({
            taskPerformerId: _id?.toString(),
            status: { $in: ['Submitted', 'Completed', 'Approved', 'Rejected'] }
        }).select('advertId');

        // Use Set to track completed advert IDs
        const completedTaskIds = new Set(userTasks.map(task => task.advertId?.toString() || ''));

        // Group adverts by platform and count remaining tasks
        const platformTaskCounts: Record<string, { totalTasks: number; remainingTasks: number }> = {};

        adverts.forEach(advert => {
            const platformName = advert.platform || 'Unknown';

            // Initialize platform if it doesn't exist
            if (!platformTaskCounts[platformName]) {
                platformTaskCounts[platformName] = { totalTasks: 0, remainingTasks: 0 };
            }

            // Count each advert as a total task for the platform
            platformTaskCounts[platformName].totalTasks += 1;

            // Count as remaining if the advert hasn't been completed by the user
            if (!completedTaskIds.has(advert._id.toString())) {
                platformTaskCounts[platformName].remainingTasks += 1;
            }
        });

        // Send response with total and remaining tasks for each platform
        res.status(200).json(platformTaskCounts);
    } catch (error) {
        res.status(500).json({ error });
    }
});

// get advert by id
export const getAdvertById = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params
		try {
			const advert = await Advert.findById({ _id: id }).populate('userId')

			const tasksCount = await Task.countDocuments({
				advertId: new mongoose.Types.ObjectId(id),
			})
			const currentTasks = advert?.tasks
			if (currentTasks) {
				advert.tasks = tasksCount
			}

			if (!advert) {
				res.status(400).json({ message: 'Advert not found' })
				return
			}
			res.status(200).json(advert)
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)
