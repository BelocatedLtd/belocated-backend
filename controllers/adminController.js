import asyncHandler from 'express-async-handler'
import Advert from '../model/Advert.js'
import Task from '../model/Task.js'
import Transaction from '../model/Transaction.js'
import User from '../model/User.js'

export const adminDashboard = asyncHandler(async (req, res) => {
	try {
		const { userId } = req.body
		console.log('🚀 ~ adminDashboard ~ userId:', req.user)
		// const user = await User.findById(userId)
		// if (!user) {
		// 	res.status(400).json({ message: 'User not found' })
		// }

		// const admins = await User.find({ accountType: 'Admin' })
		// if (!admins) {
		// 	res.status(400).json({ message: 'No admin found' })
		// }

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
		res.status(500).json({ error: error.message })
	}
})
