import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';
import { AiFillDelete } from 'react-icons/ai';
import { MdArrowDownward, MdOutlineKeyboardArrowLeft } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataSearch from '../../../components/adminComponents/DataSearch';
import Loader from '../../../components/loader/Loader';
import {
	handleGetAllActivities,
	selectActivities,
} from '../../../redux/slices/feedSlice';
import { selectTasks } from '../../../redux/slices/taskSlice';
import { selectIsLoading } from '../../../redux/slices/userSlice';
import { trashAllUserActivities } from '../../../services/feedService';
import { getAllUser } from '../../../services/userServices';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const Users = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const tasks = useSelector(selectTasks);
	const activities = useSelector(selectActivities);
	const sortIcon = <MdArrowDownward />;
	const [activityIsLoading, setactivityIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRows, setTotalRows] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [summary, setSummary] = useState({
		totalUsers: 0,
		totalTasksCompleted: 0,
		totalReferrals: 0,
		usersWithCompletedTasks: 0,
		usersWithOngoingTasks: 0,
		totalTasksOngoing: 0,
		referralStats: 0,
	});

	useEffect(() => {
		dispatch(handleGetAllActivities());
	}, []);

	const trashAllActivities = async () => {
		if (activities.length < 500) {
			toast.error('Let\'s allow it to get to at least 500 activities in the feed');
			return;
		}

		setactivityIsLoading(true);
		try {
			const response = await trashAllUserActivities();
			toast.success('Activity feed emptied successfully');
		} catch (error) {
			toast.error("Failed to trash users' activities");
			console.error(error);
		} finally {
			setactivityIsLoading(false);
		}
	};

	const handleFilter = (search) => {
		setSearchTerm(search);
		fetchUsers(currentPage, rowsPerPage, search, startDate, endDate);
	};

	const columns = [
		{ name: 'Fullname', selector: (row) => row.fullname },
		{ name: 'Username', selector: (row) => row.username, sortable: true },
		{ name: 'Email', selector: (row) => row.email },
		{ name: 'Phone', selector: (row) => row.phone, sortable: true },
		{ name: 'State', selector: (row) => row.location, sortable: true },
		{ name: 'Gender', selector: (row) => row.gender, sortable: true },
		{ name: 'Tasks Completed', selector: (row) => row.taskCompleted, sortable: true },
		{
			name: 'Referred Users',
			selector: (row) => row.referrals?.length,
			sortable: true,
		},
		{
			name: 'Actions',
			button: true,
			cell: (row) => (
				<button
					className='bg-[#18141E] text-gray-100 px-3 py-2 rounded-2xl hover:bg-btn hover:bg-secondary'
					onClick={(e) => handleButtonClick(e, row._id)}>
					View User
				</button>
			),
		},
	];

	const COLORS = ['#4bc0c0', '#ffce56', '#36a2eb'];

	const customStyles = {
		headCells: {
			style: {
				backgroundColor: '#18141E',
				color: '#f4f4f4',
				fontSize: '15px',
			},
		},
	};

	const handleButtonClick = (e, userId) => {
		e.preventDefault();
		navigate(`/admin/dashboard/user/${userId}`);
	};

	const handleStartDateChange = (e) => setStartDate(e.target.value);
	const handleEndDateChange = (e) => setEndDate(e.target.value);
	const applyDateFilter = () => fetchUsers(currentPage, rowsPerPage, searchTerm, startDate, endDate);

	const handlePageChange = (page) => {
		setCurrentPage(page);
		fetchUsers(page, rowsPerPage, searchTerm, startDate, endDate);
	};

	const handleChangeRowsPerPage = (rowsPerPage) => {
		setRowsPerPage(rowsPerPage);
		fetchUsers(currentPage, rowsPerPage, searchTerm, startDate, endDate);
	};

	const fetchUsers = async (page, limit, search = '', startDate = '', endDate = '') => {
		try {
			setIsLoading(true);
			const response = await getAllUser(page, limit, search, startDate, endDate);
			if (response) {
				setTotalRows(response.totalUsers);
				setUsers(response.users);
				setSummary({
					totalUsers: response.totalUsers,
					totalTasksCompleted: response.totalTasksCompleted,
					totalReferrals: response.totalReferralsByAllUsers,
					usersWithCompletedTasks: response.usersWithCompletedTasks,
					referralStats: response.referralStats,
					usersWithOngoingTasks: response.usersWithOngoingTasks,
					totalTasksOngoing: response.totalTasksOngoing
				});
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error('Error fetching users');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(currentPage, rowsPerPage, searchTerm, startDate, endDate);
	}, []);

	const pieChartData = [
		{ name: 'Tasks Completed', value: summary.totalTasksCompleted },
		{ name: 'Ongoing Tasks', value: summary.totalTasksOngoing },
		{ name: 'Referrals', value: summary.totalReferrals },
	];

	return (
		<div className='w-full mx-auto mt-[2rem]'>
			{activityIsLoading && <Loader />}
			<div className='flex items-center justify-between mb-[2rem]'>
				<div className='flex items-center'>
					<MdOutlineKeyboardArrowLeft
						size={30}
						onClick={() => navigate(-1)}
						className='mr-1'
					/>
					<p className='font-semibold text-xl text-gray-700'>Users</p>
				</div>
				<div className='flex items-center gap-2'>
					<label>User Activities:</label>
					<p>{activities.length}</p>
					<AiFillDelete
						className='text-secondary hover:text-tertiary'
						onClick={trashAllActivities}
					/>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<div className="p-4 bg-white shadow rounded">
					<h3 className="text-sm text-gray-500">Total Users</h3>
					<p className="text-xl font-semibold">{summary.totalUsers}</p>
				</div>
				<div className="p-4 bg-white shadow rounded">
					<h3 className="text-sm text-gray-500">Total Tasks Completed</h3>
					<p className="text-xl font-semibold">{summary.totalTasksCompleted}</p>
					<p className="text-green-500 font-bold">{summary.usersWithCompletedTasks} Users</p>
				</div>
				<div className="p-4 bg-white shadow rounded">
					<h3 className="text-sm text-gray-500">Total Tasks Ongoing</h3>
					<p className="text-xl font-semibold">{summary.totalTasksOngoing}</p>
					<p className="text-yellow-500 font-bold">{summary.usersWithOngoingTasks} Users</p>
				</div>
				<div className="p-4 bg-white shadow rounded">
					<h3 className="text-sm text-gray-500">Referral Stats</h3>
					<p className="text-xl font-semibold">{summary.totalReferrals}</p>
					<p className="text-yellow-500 font-bold">{summary.referralStats}Users</p>
				</div>
			</div>
			{/* Filters and Pie Chart */}
			<div className="flex flex-wrap gap-4 mb-6">
				<div className="flex flex-col sm:flex-row gap-4 items-center">
					<input
						type="date"
						value={startDate}
						onChange={handleStartDateChange}
						className="p-2 border rounded bg-white shadow"
					/>
					<input
						type="date"
						value={endDate}
						onChange={handleEndDateChange}
						className="p-2 border rounded bg-white shadow"
					/>
					<button
						onClick={applyDateFilter}
						className="p-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
					>
						Apply
					</button>
				</div>
				<div className="w-full sm:w-auto mx-auto">
					<PieChart width={400} height={300}>
						<Pie
							data={pieChartData}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={120}
							fill="#8884d8"
						>
							{pieChartData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</div>
			</div>

			{/* User Table */}
			<DataSearch placeholder='Search User...' handleFilter={handleFilter} />
			{users.length > 0 ? (
				<DataTable
					columns={columns}
					data={users}
					progressPending={isLoading}
					pagination
					selectableRows
					paginationServer
					fixedHeader
					customStyles={customStyles}
					sortIcon={sortIcon}
					paginationTotalRows={totalRows}
					onChangePage={handlePageChange}
					onChangeRowsPerPage={handleChangeRowsPerPage}
				/>
			) : (
				<p>No users found.</p>
			)}
		</div>
	);
};

export default Users;
