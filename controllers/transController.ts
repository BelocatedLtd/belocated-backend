import * as crypto from 'crypto'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Advert from '../model/Advert'
import Transaction from '../model/Transaction'
import User from '../model/User'
import Wallet from '../model/Wallet'
import Withdraw from '../model/Withdraw'
import { io } from '../app';
import { saveActivity } from '../controllers/feedController'
import { v2 as cloudinary } from 'cloudinary'

//Get User Wallet
export const getUserWallet = asyncHandler(
	async (req: Request, res: Response) => {
		try {
			const wallet = await Wallet.findOne({ userId: req.user._id })
			if (!wallet) {
				res.status(400).json('No User Wallet Found')
			} else {
				res.status(200).json(wallet)
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

//Get User Wallet
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
	const { userId } = req.params

	if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin'
	) {
		res.status(401).json({ message: 'Not Authorized' })
		throw new Error('Not Authorized')
	}

	const wallet = await Wallet.findOne({ userId })

	if (!wallet) {
		res.status(400).json({ message: 'No User Wallet Found' })
		throw new Error('No User Wallet Found')
	}

	res.status(200).json(wallet)
})

//Get Single User Wallet
export const getSingleUserWallet = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params

		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res.status(401).json({ message: 'Not Authorized' })
			throw new Error('Not Authorized')
		}

		const wallet = await Wallet.findOne({ userId: id })

		if (!wallet) {
			res.status(400).json({ message: 'No User Wallet Found' })
			throw new Error('No User Wallet Found')
		}

		res.status(200).json(wallet)
	},
)

//Fund User Wallet
export const fundUserWallet = asyncHandler(async (req: Request, res: Response) => {
	const { userId, email, date, chargedAmount, trxId, paymentRef, status } = req.body;

	// Validation
	if (!userId || !chargedAmount || !trxId || !paymentRef) {
		res.status(400).json({ message: 'Some required fields are missing!' });
		throw new Error('Some required fields are empty');
	}

	try {
		// Fetch Wallet
		const wallet = await Wallet.findOne({ userId: req.user._id.toString() });
		if (!wallet) {
			res.status(400).json({ message: 'Wallet not found' });
			throw new Error('Wallet not found');
		}

		// Match wallet with user
		if (wallet.userId !== userId) {
			res.status(401).json({ message: 'User not authorized' });
			throw new Error('User not authorized');
		}

		// Update Wallet
		const updatedWallet = await Wallet.findOneAndUpdate(
			{ userId: req.user._id.toString() },
			{ $inc: { value: chargedAmount } },
			{ new: true, runValidators: true }
		);

		if (!updatedWallet) {
			res.status(401).json({ message: 'Failed to fund wallet, contact Admin' });
			throw new Error('Failed to fund wallet, contact Admin');
		}

		// Update or Create Transaction
		const transaction = await Transaction.findOneAndUpdate(
			{ paymentRef }, // Unique payment reference
			{
				$set: {
					userId: userId, // Explicit if needed
					email: email,   // Explicit if needed
					date: date,     // Explicit if needed
					chargedAmount: chargedAmount, // Explicit if needed
					trxId: trxId,   // Explicit if needed
					trxType: 'wallet_funding',
					status: 'Success', // Explicitly include status
				},
			},
			{ new: true, upsert: true }
		);

		if (!transaction) {
			throw new Error('Failed to save transaction');
		}

		// Update User
		if (chargedAmount >= 200 || updatedWallet.value >= 200) {
			const user = await User.findOneAndUpdate(
				{ _id: req.user._id }, // Query by _id
				{ canAccessEarn: true },
				{ new: true }
			);
		}

		res.status(201).json(updatedWallet);
	} catch (error) {
		res.status(500).json({ error });
	}
});

export const initializeTransaction = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			userId,
			email,
			amount,
			paymentRef,
			date,
			advertId,
			paymentMethod,
			paymentType,
		} = req.body

		// Validation
		if (!userId || !email || !amount || !paymentMethod) {
			res.status(400).json({ message: 'Some required fields are missing!' })
			throw new Error('Some required fields are empty')
		}

		try {
			const existingTransaction = await Transaction.findOne({ paymentRef })
			if (existingTransaction) {
				res.status(400).json({
					message: 'A transaction with this payment reference already exists!',
				})
				return
			}

			// Create New Transaction
			const transaction = await Transaction.create({
				userId,
				email,
				chargedAmount: amount,
				paymentMethod,
				paymentRef,
				date,
				trxType: paymentType,
				status: 'Pending',
				trxId: advertId ? `ad_p${advertId}` : `ad_p${paymentRef}`,
			})

			if (transaction) {
				res.status(201).json(transaction)
			} else {
				res.status(400).json({ message: 'Failed to initialize transaction' })
				throw new Error('Failed to initialize transaction')
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

export const handlePaystackWebhook = asyncHandler(
	async (req: Request, res: Response) => {
		// Verify the event (using Paystack's verification method)
		const secret = process.env.PAYSTACK_SECRET_KEY
		const hash = req.headers['x-paystack-signature']

		if (!secret) {
			throw new Error('Invalid secret')
		}

		const hashDigest = crypto
			.createHmac('sha512', secret)
			.update(JSON.stringify(req.body))
			.digest('hex')

		if (hash !== hashDigest) {
			throw new Error('Invalid request signature')
		}

		const event = req.body

		if (event.event === 'charge.success') {
			const { reference, amount, customer, status } = event.data

			try {
				// Find the transaction
				const transaction = await Transaction.findOne({ paymentRef: reference })

				if (!transaction) {
					res.status(404).json({ message: 'Transaction not found' })
					throw new Error('Transaction not found')
				}

				// Update the transaction status
				transaction.status = status
				await transaction.save()

				const advertId = transaction.trxId.split('ad_p')[1]

				if (!advertId) {
					res.status(400).json({ message: 'Invalid transaction ID format' })
					throw new Error('Invalid transaction ID format')
				}

				// Find the advert
				const advert = await Advert.findById(advertId)

				if (!advert) {
					res.status(404).json({ message: 'Advert not found' })
					throw new Error('Advert not found')
				}

				// Fund the user wallet if transaction is successful
				if (status === 'success') {
					advert.status = 'Running'
					await advert.save()

					res.status(200)
				} else {
					res.status(400).json({ message: 'Transaction not successful' })
				}
			} catch (error) {
				res.status(500).json({ error })
			}
		} else {
			res.status(400).json({ message: 'Event not handled' })
		}
	},
)

// export const handleFlutterwaveWebhook = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const secretHash = process.env.FLW_SECRET_HASH
// 		const signature = req.headers['verif-hash']
// 		if (!signature || signature !== secretHash) {
// 			// This request isn't from Flutterwave; discard
// 			res.status(401).end()
// 		}
// 		const payload = req.body
// console.log(payload);
// 		const { txRef, amount, customer, status } = payload

// 		try {
// 			// Find the transaction
// 			const transaction = await Transaction.findOne({ paymentRef: txRef })
// 			console.log('🚀 ~ handleFlutterwaveWebhook ~ transaction:', transaction)

// 			if (!transaction) {
// 				res.status(404).json({message:'Transaction not found'});
// 				return;
// 			}

// 			// Update the transaction status
// 			transaction.status = status
// 			await transaction.save()

// 			if (transaction.trxType === 'wallet_funding') {
// 				if (status === 'successful') {
// 					const wallet = await Wallet.findOne({ userId: transaction.userId })
// 					if (!wallet) {
// 						throw new Error('Wallet not found')
// 					}

// 					wallet.value += amount
// 					wallet.totalEarning += amount
// 					await wallet.save()

// 					res.status(200).json({ message: 'Wallet funded successfully' })
// 				} else {
// 					throw new Error('Transaction not successful')
// 				}
// 			} else if (transaction.trxType === 'advert_payment') {
// 				const advertId = transaction.trxId.split('ad_p')[1]

// 				if (!advertId) {
// 					throw new Error('Invalid transaction ID format')
// 				}

// 				const advert = await Advert.findById(advertId)

// 				if (!advert) {
// 					throw new Error('Advert not found')
// 				}

// 				if (status === 'successful') {
// 					advert.status = 'Running'
// 					await advert.save()
// 					res.status(200)
// 				} else {
// 					res.status(400).json({ message: 'Transaction not successful' })
// 				}
// 			}
// 		} catch (error) {
// 			res.status(500).json({ error })
// 		}
// 	},
// )



export const handleFlutterwaveWebhook = asyncHandler(
	async (req: Request, res: Response) => {
		const secretHash = process.env.FLW_SECRET_HASH;

		// Validate webhook signature
		const signature = req.headers["verif-hash"];
		if (!signature || signature !== secretHash) {
			console.warn("Invalid signature from Flutterwave webhook");
			res.status(401).end();
			return;
		}

		const payload = req.body;
		console.log("Received Flutterwave payload:", payload);

		const { event, data } = payload;

		// Handle successful charge events
		if (event === "charge.completed" || event === "charge.successful") {
			const { status, tx_ref, amount, customer } = data;

			if (status === "successful") {
				console.log("Successful payment:", { tx_ref, amount });

				try {
					// Find the transaction using the payment reference
					const transaction = await Transaction.findOne({ paymentRef: tx_ref });

					if (!transaction) {
						console.error(`Transaction not found for reference: ${tx_ref}`);
						res.status(404).json({ message: "Transaction not found" });
						return;
					}

					// Check if transaction is already processed
					if (transaction.status === "successful") {
						console.log(`Transaction already processed: ${tx_ref}`);
						res.status(200).json({ message: "Transaction already processed" });
						return;
					}

					// Update the transaction status
					transaction.status = status;
					await transaction.save();

					// Handle wallet funding
					if (transaction.trxType === "wallet_funding") {
						const wallet = await Wallet.findOne({ userId: transaction.userId });

						if (!wallet) {
							throw new Error("Wallet not found");
						}

						wallet.value += amount;
						wallet.totalEarning += amount;
						await wallet.save();


						const user = await User.findOne({ _id: transaction.userId });

						if (!user) {
							throw new Error("User not found");
						}

						// Update user's earning eligibility if criteria met
						if (amount >= 200 || wallet.value >= 200) {
							await User.findOneAndUpdate(
								{ _id: transaction.userId },
								{ canAccessEarn: true },
								{ new: true }
							);
						}

						console.log(`Wallet funded successfully for user: ${transaction.userId}`);

						const emitData = {
							userId: transaction.userId,
							action: `@${user.username} just funded wallet with ₦${amount}`,
						};
						io.emit('sendActivity', emitData); // Emit event to all connected clients
						saveActivity(emitData); // Save the activity



						res.status(200).json({ message: "Wallet funded successfully" });
						return;
					}

					// Handle advert payment
					if (transaction.trxType === "advert_payment") {
						const advertId = transaction.trxId.split("ad_p")[1];

						if (!advertId) {
							console.error(`Invalid transaction ID format: ${transaction.trxId}`);
							res.status(400).json({ message: "Invalid transaction ID format" });
							return;
						}

						const advert = await Advert.findById(advertId);

						if (!advert) {
							console.error(`Advert not found for ID: ${advertId}`);
							res.status(404).json({ message: "Advert not found" });
							return;
						}

						if (status === "successful") {
							advert.status = "Running"; // Update advert status
							await advert.save();
							console.log(`Advert payment successful for ID: ${advertId}`);
							res.status(200).json({ message: "Advert payment successful" });
							return;
						} else {
							console.warn(`Advert payment failed for ID: ${advertId}`);
							res.status(400).json({ message: "Advert payment failed" });
							return;
						}
					}
				} catch (error) {
					console.error("Error processing payment:", error);
					res.status(500).json({ message: "An error occurred while processing the payment", error });
					return;
				}
			} else {
				console.warn("Payment status not successful:", status);
				res.status(400).json({ message: "Payment failed" });
				return;
			}
		}

		console.warn("Unhandled event:", event);
		res.status(400).send("Unhandled event");
	}
);

export const handleKoraPayWebhook = asyncHandler(async (req: Request, res: Response) => {
	const payload = req.body;
	const signature = req.headers['x-korapay-signature'];
	const secretKey = process.env.KORA_PAY_SECKEY;

	// Ensure the secret key is defined
	if (!secretKey) {
		console.error('Webhook secret key is missing');
		res.status(500).send('Webhook secret key is missing');
		return;
	}

	// Verify the webhook signature
	const hash = crypto.createHmac('sha256', secretKey)
		.update(JSON.stringify(payload.data)) // Assuming payload.data is the transaction data
		.digest('hex');

	if (hash !== signature) {
		console.error('Invalid webhook signature');
		res.status(401).send('Invalid signature');
		return;
	}

	const { event, data } = payload;

	// Supported events
	if (event === 'transfer.success' || event === 'charge.success') {
		const { status, reference, amount, customer } = data;

		// Normalize status to handle "success" and "successful"
		const normalizedStatus = status === 'success' || status === 'successful' ? 'success' : status;

		if (normalizedStatus === 'success') {
			try {
				// Check if the transaction exists
				const transaction = await Transaction.findOne({ paymentRef: reference });

				if (!transaction) {
					console.error(`Transaction not found: ${reference}`);
					res.status(404).json({ message: 'Transaction not found' });
					return;
				}

				// Prevent duplicate processing
				if (transaction.status === 'success') {
					console.log(`Transaction already processed: ${reference}`);
					res.status(200).send('Transaction already processed');
					return;
				}

				// Update transaction status
				transaction.status = 'success';
				transaction.paymentMethod = 'KoraPay';
				await transaction.save();

				if (transaction.trxType === 'wallet_funding') {
					const wallet = await Wallet.findOne({ userId: transaction.userId });

					if (!wallet) {
						console.error(`Wallet not found for user: ${transaction.userId}`);
						res.status(404).json({ message: 'Wallet not found' });
						return;
					}

					// Update wallet balances
					wallet.value += amount;
					wallet.totalEarning += amount;
					await wallet.save();

					const user = await User.findOne({ _id: transaction.userId });

					if (!user) {
						throw new Error("User not found");
					}

					// Check and update earning access
					if (amount >= 200 || wallet.value >= 200) {
						await User.findOneAndUpdate(
							{ _id: transaction.userId },
							{ canAccessEarn: true },
							{ new: true }
						);
					}

					const emitData = {
						userId: transaction.userId,
						action: `@${user.username} just funded wallet with ₦${amount}`,
					};
					io.emit('sendActivity', emitData); // Emit event to all connected clients
					saveActivity(emitData); // Save the activity


					console.log(`Wallet funded successfully for user: ${transaction.userId}`);
					res.status(200).json({ message: 'Wallet funded successfully' });
					return;
				} else if (transaction.trxType === 'advert_payment') {
					const advertId = transaction.trxId.split('ad_p')[1];
					const advert = await Advert.findById(advertId);

					if (!advert) {
						console.error(`Advert not found for ID: ${advertId}`);
						res.status(404).json({ message: 'Advert not found' });
						return;
					}

					advert.status = 'Running';
					await advert.save();

					console.log(`Advert payment successful for advert ID: ${advertId}`);
					res.status(200).json({ message: 'Advert payment successful' });
					return;
				}
			} catch (error) {
				console.error('Error processing webhook:', error);
				res.status(500).json({ message: 'Internal server error', error });
				return;
			}
		} else {
			console.log(`Payment failed for reference: ${reference}`);
			res.status(400).json({ message: 'Transaction not successful' });
			return;
		}
	} else {
		console.log(`Unhandled event type: ${event}`);
		res.status(400).send('Unhandled event type');
		return;
	}
});




//Withdraw User Wallet
export const withdrawWallet = asyncHandler(
	async (req: Request, res: Response) => {
		const { userId, withdrawAmount, withdrawalMethod } = req.body

		// Validation
		if (!userId || !withdrawAmount || !withdrawalMethod) {
			res.status(400).json({ message: 'Some required fields are missing!' })
			throw new Error('Some required fields are empty')
		}

		const user = await User.findById(userId)
		if (!user) {
			throw new Error('User not found')
		}

		const wallet = await Wallet.findOne({ userId: user._id })

		// Validation
		if (!user) {
			res.status(404).json({ message: 'User not found' })
			throw new Error('User not found')
		}

		if (!wallet) {
			res.status(400).json({ message: 'User Wallet not found' })
			throw new Error('User Wallet not found')
		}

		if (wallet.value >= withdrawAmount) {
			try {
				// Update User wallet
				wallet.value -= withdrawAmount

				const updatedUserWallet = await wallet.save()

				if (!updatedUserWallet) {
					res
						.status(401)
						.json({ message: 'Faild to withdraw from wallet, contact Admin' })
					throw new Error('Faild to fund wallet, contact Admin')
				}

				let withdrawalRequest

				if (updatedUserWallet) {
					withdrawalRequest = await Withdraw.create({
						userId,
						withdrawAmount,
						status: 'Pending Approval',
						withdrawMethod: withdrawalMethod,
					})

					if (!withdrawalRequest) {
						res
							.status(500)
							.json({ message: 'Error creating withdrawal request' })
						throw new Error('Error creating withdrawal request')
					}

					//Create New Transaction
					const transaction = await Transaction.create({
						userId: userId,
						email: user?.email,
						date: Date.now(),
						chargedAmount: withdrawAmount,
						trxId: `wd-${userId}`,
						paymentMethod: `${withdrawalMethod}`,
						paymentRef: withdrawalRequest._id,
						trxType: `${withdrawalMethod}`,
						status: 'Pending Approval',
					})

					if (!transaction) {
						throw new Error('Error creating transaction')
					}
				}

				res.status(200).json(wallet)
			} catch (error) {
				res.status(500).json({ error })
			}
		} else {
			res.status(500).json({ message: 'Insufficient Balance' })
			throw new Error('Insufficient Balance')
		}
	},
)

//Get all user Withdrawals
 export const getWithdrawals = asyncHandler(
	async (req: Request, res: Response) => {
	  if (
		req.user.accountType !== 'Admin' &&
		req.user.accountType !== 'Super Admin'
	  ) {
		res.status(401).json({ message: 'Unauthorized user' });
		throw new Error('Unauthorized user');
	  }
  
	  try {
		const withdrawals = await Withdraw.find().sort('-createdAt');
		
		if (!withdrawals || withdrawals.length === 0) {
		  res.status(400).json({ message: 'Withdrawal request list empty' });
		  throw new Error('Withdrawal request list empty');
		}
  
		// Manually populate user details for each withdrawal and exclude password
		const populatedWithdrawals = await Promise.all(
		  withdrawals.map(async (withdrawal) => {
			const user = await User.findOne({ _id: withdrawal.userId }, '-password').lean();
			return { ...withdrawal.toObject(), user };
		  })
		);
  
		res.status(200).json(populatedWithdrawals);
	  } catch (error) {
		res.status(500).json({ error });
	  }
	}
  );
//Confirm Withdrawal Request
export const confirmWithdrawalRequest = asyncHandler(
	async (req: Request, res: Response) => {
		const { withdrawalRequestId } = req.params

		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res.status(401).json({ message: 'Unauthorized user' })
			throw new Error('Unauthorized user')
		}

		const wdRequest = await Withdraw.findById(withdrawalRequestId)
		const wdTrx = await Transaction.findOne({ paymentRef: withdrawalRequestId })

		if (!wdRequest) {
			res.status(400).json({ message: 'Cannot find withdrawal request' })
			throw new Error('Cannot find withdrawal request')
		}

		if (!wdTrx) {
			res.status(400).json({ message: 'Cannot find withdrawal trx' })
			throw new Error('Cannot find withdrawal trx')
		}

		if (wdRequest.status === 'Approved') {
			res
				.status(400)
				.json({ message: 'This withdrawal request has already being approved' })
			throw new Error('This withdrawal request has already being approved')
		}

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

   

		//Update task status after user submit screenshot
		const updatedwdRequest = await Withdraw.findByIdAndUpdate(
			{ _id: withdrawalRequestId },
			{
					proofOfWorkMediaURL: uploadedImages,
				status: 'Approved',
			},
			{
				new: true,
				runValidators: true,
			},
		)

		if (!updatedwdRequest) {
			res.status(500).json({ message: 'Error trying to update task status' })
			throw new Error('Failed to approve task')
		}

		if (updatedwdRequest) {
			//Update trx status
			const updatedTrx = await Transaction.updateOne(
				{ paymentRef: withdrawalRequestId },
				{
					status: 'Approved',
				},
			)

			if (!updatedTrx) {
				res.status(500).json({ message: 'Error trying to update trx status' })
				throw new Error('Error trying to update trx status')
			}
		}

		res.status(200).json(updatedwdRequest)
	},
)

//Delete Withdrawal Request
// TODO: only admin can delete
export const deleteWithdrawalRequest = asyncHandler(
	async (req: Request, res: Response) => {
		const { withdrawalRequestId } = req.params

		// const wdRequest = await Withdraw.findById(withdrawalRequestId)
		const wdTrx = await Transaction.find({ paymentRef: withdrawalRequestId })

		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res.status(401).json({ message: 'Unauthorized user' })
			throw new Error('Unauthorized user')
		}

		const wdRequest = await Withdraw.findById(withdrawalRequestId)

		if (!wdRequest) {
			throw new Error('Withdrawal request does not exist or already deleted')
		}

		if (wdRequest.status == 'Approved') {
			res
				.status(400)
				.json({ message: 'Withdrawal request has already been approved' })
			throw new Error('Withdrawal request has already been approved')
		}

		if (!wdRequest) {
			res.status(400).json({
				message: 'Withdrawal request does not exist or already deleted',
			})
			throw new Error('Withdrawal request does not exist or already deleted')
		}

		const delWdRequest = await Withdraw.findByIdAndDelete(withdrawalRequestId)

		if (!delWdRequest) {
			res.status(500).json({ message: 'Error Deleting' })
			throw new Error('Error Deleting')
		}

		if (delWdRequest) {
			//Update task status after user submit screenshot
			const updatedTrx = await Transaction.updateOne(
				{ paymentRef: withdrawalRequestId },
				{
					status: 'Rejected',
				},
			)

			// Put back the user's money back to their wallet
			const updateUserWallet = await Wallet.updateOne(
				{ userId: wdRequest.userId },
				{
					$inc: { value: +wdRequest.withdrawAmount },
				},
			)

			if (!updatedTrx || !updateUserWallet) {
				res.status(500).json({
					message: 'Error trying to update trx status and user wallet',
				})
				throw new Error('Error trying to update trx status and user wallet')
			}
		}

		const wdRequests = await Withdraw.find().sort('-createdAt')
		res.status(200).json(wdRequests)
	},
)

//Get user Transactions
// http://localhost:6001/api/transactions/userall
export const getUserWithdrawals = asyncHandler(
	async (req: Request, res: Response) => {
		const { _id } = req.user

		try {
			const withdrawals = await Withdraw.find({ userId: _id }).sort(
				'-createdAt',
			)
			if (!withdrawals) {
				res.status(400).json({
					message: 'Cannot find any withdrawal request made by this user',
				})
				throw new Error('Cannot find any withdrawal request made by this user')
			}

			if (withdrawals) {
				res.status(200).json(withdrawals)
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

//Get user Transactions
// http://localhost:6001/api/transactions/userall

export const getUserTransactions = asyncHandler(async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1
		const limit = parseInt(req.query.limit as string) || 10

		let transactions

		const matchStage = { userId: req.user._id } // Match transactions by userId

		if (!page && !limit) {
			// Fetch all transactions with withdrawal proof
			transactions = await Transaction.aggregate([
				{ $match: matchStage }, // Filter by userId
				{
					$lookup: {
						from: 'withdraw', // Collection name for Withdrawals
						localField: 'paymentRef', // Field in Transaction
						foreignField: '_id', // Field in Withdrawals
						as: 'withdrawalDetails', // Alias for joined data
					},
				},
				{
					$unwind: {
						path: '$withdrawalDetails',
						preserveNullAndEmptyArrays: true, // Keep transactions without withdrawal info
					},
				},
				{
					$project: {
						_id: 1,
						amount: 1,
						status: 1,
						createdAt: 1,
						withdrawalProof: '$withdrawalDetails.proofOfWorkMediaURL', // Include proof
					},
				},
				{ $sort: { createdAt: -1 } },
			])
		} else {
			const currentPage = page || 1
			const currentLimit = limit || 10

			const startIndex = (currentPage - 1) * currentLimit

			// Paginated transactions with withdrawal proof
			transactions = await Transaction.aggregate([
				{ $match: matchStage }, // Filter by userId
				{
					$lookup: {
						from: 'withdraw', // Collection name for Withdrawals
						localField: 'paymentRef', // Field in Transaction
						foreignField: '_id', // Field in Withdrawals
						as: 'withdrawalDetails', // Alias for joined data
					},
				},
				{
					$unwind: {
						path: '$withdrawalDetails',
						preserveNullAndEmptyArrays: true, // Keep transactions without withdrawal info
					},
				},
				{
					$project: {
						_id: 1,
						amount: 1,
						status: 1,
						createdAt: 1,
						withdrawalProof: '$withdrawalDetails.proofOfWorkMediaURL', // Include proof
					},
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: startIndex },
				{ $limit: currentLimit },
			])

			const totalTransactions = await Transaction.countDocuments(matchStage)
			const totalPages = Math.ceil(totalTransactions / currentLimit)

			res.status(200).json({
				transactions,
				page: currentPage,
				totalPages,
				totalTransactions,
				hasNextPage: currentPage < totalPages,
				hasPreviousPage: currentPage > 1,
			})
			return;
		}

		if (!transactions || transactions.length === 0) {
			res.status(400).json({ message: 'Cannot find any transaction made by this user' })
			throw new Error('Cannot find any transaction made by this user')
		}

		res.status(200).json(transactions)
	} catch (error:any) {
		res.status(500).json({ error: error.message || error })
	}
})


/*  GET ALL TRANSACTIONS */
// http://localhost:6001/api/transactions/all
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
	// Authorization check
	if (req.user.accountType !== 'Admin' && req.user.accountType !== 'Super Admin') {
		res.status(403).json({ message: 'Not authorized' });
		return;
	}

	// Extract and parse query parameters
	const page = Math.max(1, parseInt(req.query.page as string) || 1);
	const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
	const startDateStr = req.query.startDate as string;
	const endDateStr = req.query.endDate as string;

	const currentPage = page;
	const startIndex = (currentPage - 1) * limit;

	let matchFilter = {};

	if (startDateStr && endDateStr) {
		const startDate = new Date(startDateStr);
		const endDate = new Date(endDateStr);

		if (startDate > endDate) {
			res.status(400).json({ message: 'Start date must be before or equal to end date' });
			return;
		}

		matchFilter = {
			createdAt: {
				$gte: startDate,
				$lte: endDate
			}
		};
	} else if (startDateStr || endDateStr) {
		res.status(400).json({ message: 'Both start and end date must be provided for date range filtering' });
		return;
	}

	console.log('Date Range Filter:', matchFilter);

	try {
		const totalMatchingTransactions = await Transaction.countDocuments(matchFilter);
		const currentLimit = Math.min(totalMatchingTransactions, limit);

		console.log('Total transactions matching filter:', totalMatchingTransactions);

		// Aggregation pipeline
		const transactions = await Transaction.aggregate([
			{ $match: matchFilter },
			{ $sort: { createdAt: -1 } },
			{ $skip: startIndex },
			{ $limit: currentLimit },
			{
				$addFields: {
					userId: { $toObjectId: "$userId" }
				},
			},
			{
				$lookup: {
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'userDetails',
				},
			},
			{
				$unwind: {
					path: '$userDetails',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$project: {
					_id: 1,
					trxId: 1,
					trxType: 1,
					chargedAmount: 1,
					date: 1,
					status: 1,
					username: '$userDetails.username',
					fullname: '$userDetails.fullname',
				},
			},
		]);

		if (transactions.length === 0) {
			res.status(404).json({ message: 'No transactions found within the specified date range' });
			return;
		}

		const totalTransactions = totalMatchingTransactions;

		// Aggregation for successful transactions within the date range
		const successfulTransactions = await Transaction.aggregate([
			{ $match: { ...matchFilter, status: { $in: ['Success', 'Successful', 'success', 'successful'] }, trxType: 'wallet_funding' } },
			{
				$group: {
					_id: null,
					totalAmount: { $sum: '$chargedAmount' },
					count: { $sum: 1 },
				},
			},
		]);

		// Aggregation for pending transactions within the date range
		const pendingTransactions = await Transaction.aggregate([
			{ $match: { ...matchFilter, status: { $in: ['Pending'] }, trxType: 'wallet_funding' } },
			{
				$group: {
					_id: null,
					totalAmount: { $sum: '$chargedAmount' },
					count: { $sum: 1 },
				},
			},
		]);

		// Fetching unique users who made transactions within this date range
		const usersWithTransactions = await Transaction.distinct('userId', matchFilter);

		const totalPages = Math.ceil(totalTransactions / limit);

		res.status(200).json({
			transactions,
			page: currentPage,
			totalPages,
			totalTransactions,
			hasNextPage: currentPage < totalPages,
			hasPreviousPage: currentPage > 1,
			successfulTransactionCount: successfulTransactions[0]?.count || 0,
			successfulTransactionAmount: successfulTransactions[0]?.totalAmount || 0,
			pendingTransactionCount: pendingTransactions[0]?.count || 0,
			pendingTransactionAmount: pendingTransactions[0]?.totalAmount || 0,
			totalUsers: usersWithTransactions.length
		});
	} catch (error: any) {
		res.status(500).json({ message: 'Error fetching transactions', error: error.message });
	}
});

export const updateDocuments = asyncHandler(async (req: Request, res: Response) => {
	try {
		// List of user emails and references
		const userEmails = [
			'olanikeboopo@gmail.com',
			'jessedaniel882@gmail.com',
			'abidemio221@gmail.com',
			'maiarabi887@gmail.com',
			'mlifemoshob9@gmail.com',
		];
		const references = [
			'ad_p1736833068870',
			'ad_p1736806038308',
			'ad_p1736803137575',
			'ad_p1736805750154',
			'ad_p1736820880285',


		];

		// Loop through each email to process updates
		for (let i = 0; i < userEmails.length; i++) {
			const email = userEmails[i];
			const trxId = references[i]; // Use the corresponding trxId

			// Find the user
			const user = await User.findOne({ email });
			if (!user) {
				console.warn(`User not found for email: ${email}`);
				continue; // Skip to the next user if not found
			}

			// Update user's canAccessEarn field
			user.canAccessEarn = true;
			await user.save();

			// Find the transaction for the user with the specific trxId
			const transaction = await Transaction.findOne({ email: user.email, trxId });
			if (!transaction) {
				console.warn(`Transaction not found for email: ${user.email} with trxId: ${trxId}`);
				continue; // Skip to the next user if not found
			}

			// Update transaction status
			transaction.status = 'Successful';
			await transaction.save();

			// Find the wallet for the user
			const wallet = await Wallet.findOne({ userId: transaction.userId });
			if (!wallet) {
				console.warn(`Wallet not found for user: ${user.email}`);
				continue; // Skip to the next user if not found
			}

			// Update wallet values
			const amount = transaction.chargedAmount || 0; // Ensure transaction amount is valid
			wallet.value += amount;
			wallet.totalEarning += amount;
			await wallet.save();
		}

		res.status(200).json({ message: 'Documents updated successfully.' });
	} catch (error) {
		console.error('Error updating documents:', error);
		res.status(500).json({ message: 'Internal server error.', error });
	}
});
