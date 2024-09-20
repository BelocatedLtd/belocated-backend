import * as crypto from 'crypto'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Advert from '../model/Advert'
import Transaction from '../model/Transaction'
import User from '../model/User'
import Wallet from '../model/Wallet'
import Withdraw from '../model/Withdraw'

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
export const fundUserWallet = asyncHandler(
	async (req: Request, res: Response) => {
		const { userId, email, date, chargedAmount, trxId, paymentRef, status } =
			req.body

		// Validation
		if (!userId || !chargedAmount || !trxId || !paymentRef) {
			res.status(400).json({ message: 'Some required fields are missing!' })
			throw new Error('Some required fields are empty')
		}

		// Validation
		//  if ( status ==! "Approved Successful" ) {
		//     res.status(400).json('This payment has not being approved');
		//     throw new Error("This payment has not being approved")
		//  }

		// Match userId from req.body with server logged in user
		//  if (userId !== req.user._id) {
		//     res.status(401).json("User not authorized 1")
		// }

		try {
			// Getting user wallet
			const wallet = await Wallet.findOne({ userId: req.user._id })
			if (!wallet) {
				res.status(400).json({ message: 'Wallet not found' })
				throw new Error('wallet not found')
			}

			// Match existing wallet to the loggedin user
			if (wallet.userId !== userId) {
				res.status(401).json({ message: 'User not authorized 2' })
				throw new Error('User not authorized 2')
			}

			// Update User wallet
			const updatedUserWallet = await Wallet.updateOne(
				{ userId: req.user._id },
				{
					$inc: { value: chargedAmount },
				},
				{
					new: true,
					runValidators: true,
				},
			)

			if (!updatedUserWallet) {
				res.status(401).json({ message: 'Faild to fund wallet, contact Admin' })
				throw new Error('Faild to fund wallet, contact Admin')
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
					trxType: 'wallet_funding',
					status,
				})

				if (transaction) {
					const updatedWallet = await Wallet.findOne({ userId: req.user._id })
					res.status(201).json(updatedWallet)
				}
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

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

export const handleFlutterwaveWebhook = asyncHandler(
	async (req: Request, res: Response) => {
		const secretHash = process.env.FLW_SECRET_HASH
		const signature = req.headers['verif-hash']
		if (!signature || signature !== secretHash) {
			// This request isn't from Flutterwave; discard
			res.status(401).end()
		}
		const payload = req.body

		const { txRef, amount, customer, status } = payload

		try {
			// Find the transaction
			const transaction = await Transaction.findOne({ paymentRef: txRef })
			console.log('🚀 ~ handleFlutterwaveWebhook ~ transaction:', transaction)

			if (!transaction) {
				res.status(404)
				throw new Error('Transaction not found')
			}

			// Update the transaction status
			transaction.status = status
			await transaction.save()

			if (transaction.trxType === 'wallet_funding') {
				if (status === 'successful') {
					const wallet = await Wallet.findOne({ userId: transaction.userId })
					if (!wallet) {
						throw new Error('Wallet not found')
					}

					wallet.value += amount
					wallet.totalEarning += amount
					await wallet.save()

					res.status(200).json({ message: 'Wallet funded successfully' })
				} else {
					throw new Error('Transaction not successful')
				}
			} else if (transaction.trxType === 'advert_payment') {
				const advertId = transaction.trxId.split('ad_p')[1]

				if (!advertId) {
					throw new Error('Invalid transaction ID format')
				}

				const advert = await Advert.findById(advertId)

				if (!advert) {
					throw new Error('Advert not found')
				}

				if (status === 'successful') {
					advert.status = 'Running'
					await advert.save()
					res.status(200)
				} else {
					res.status(400).json({ message: 'Transaction not successful' })
				}
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

//Withdraw User Wallet
export const withdrawWallet = asyncHandler(
	async (req: Request, res: Response) => {
		const { userId, withdrawAmount, withdrawalMethod } = req.body

		// Validation
		if (!userId || !withdrawAmount || !withdrawalMethod) {
			res.status(400).json({ message: 'Some required fields are missing!' })
			throw new Error('Some required fields are empty')
		}

		const user = await User.findById(req.user._id)
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
						paymentRef: withdrawalRequest._id,
						trxType: `Withdraw by - ${withdrawalMethod}`,
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
			res.status(401).json({ message: 'Unauthorized user' })
			throw new Error('Unauthorized user')
		}

		try {
			const withdrawals = await Withdraw.find().sort('-createdAt')
			if (!withdrawals) {
				res.status(400).json({ message: 'Withdrawal request list empty' })
				throw new Error('Withdrawal request list empty')
			}

			if (withdrawals) {
				res.status(200).json(withdrawals)
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

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

		//Update task status after user submit screenshot
		const updatedwdRequest = await Withdraw.findByIdAndUpdate(
			{ _id: withdrawalRequestId },
			{
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
export const getUserTransactions = asyncHandler(
	async (req: Request, res: Response) => {
		try {
			const transactions = await Transaction.find({
				userId: req.user._id,
			}).sort('-createdAt')
			if (!transactions) {
				res
					.status(400)
					.json({ message: 'Cannot find any transaction made by this user' })
				throw new Error('Cannot find any transaction made by this user')
			}

			if (transactions) {
				res.status(200).json(transactions)
			}
		} catch (error) {
			res.status(500).json({ error })
		}
	},
)

/*  GET ALL TRANSACTIONS */
// http://localhost:6001/api/transactions/all
export const getTransactions = asyncHandler(
	async (req: Request, res: Response) => {
		if (
			req.user.accountType !== 'Admin' &&
			req.user.accountType !== 'Super Admin'
		) {
			res.status(400).json({ message: 'Not authorized' })
			throw new Error('Not authorized')
		}

		const transactions = await Transaction.find().sort('-createdAt')

		if (!transactions) {
			res.status(400).json({ message: 'No transaction found in the database' })
			throw new Error('No transaction found in the database')
		}

		res.status(200).json(transactions)
	},
)
