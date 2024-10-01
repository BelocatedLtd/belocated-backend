import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Advert from '../model/Advert'
import Task from '../model/Task'
import Transaction from '../model/Transaction'
import User from '../model/User'
import Wallet from '../model/Wallet'

export const adminDashboard = asyncHandler(
	async (req: Request, res: Response) => {
		try {
			const totalUsers = await User.countDocuments()
			const totalAdverts = await Advert.countDocuments()
			const totalTasks = await Task.countDocuments()
			const totalTasksCompleted = await Task.countDocuments({
				status: 'Completed',
			})
			const totalTasksOngoing = await Task.countDocuments({ status: 'Ongoing' })
			const totalTasksCancelled = await Task.countDocuments({
				status: 'Cancelled',
			})
			const totalTasksPending = await Task.countDocuments({ status: 'Pending' })
			const totalTransactions = await Transaction.countDocuments()

			res.status(200).json({
				totalUsers,
				totalAdverts,
				totalTasks,
				totalTasksCompleted,
				totalTasksOngoing,
				totalTasksCancelled,
				totalTasksPending,
				totalTransactions,
			})
		} catch (error) {
			res.status(500).json({ error: error })
		}
	},
)

// const userDetails = users?.find((user) => user?._id === id)
// const userAdList = adverts?.filter((ads) => ads?.userId === id)
// const userTasks = tasksList?.filter((task) => task?.taskPerformerId === id)
// const userTrx = transactionsList?.filter((trx) => trx?.userId === id)

export const getUserDetails = asyncHandler(
	async (req: Request, res: Response) => {
		try {
			const { id } = req.params

			const user = await User.findById(id)
			const wallet = await Wallet.findOne({ userId: id })
			const userAdList = await Advert.find({ userId: id })
			const userTasks = await Task.find({ taskPerformerId: id })
			const userTrx = await Transaction.find({ userId: id })

			res.status(200).json({
				user,
				userAdList,
				userTasks,
				userTrx,
				wallet,
			})
		} catch (error) {}
	},
)
