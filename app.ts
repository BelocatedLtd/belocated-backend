import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import mongoose from 'mongoose'

import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import http from 'http'
import morgan from 'morgan'
import cron from 'node-cron'
import path from 'path'
import { Server } from 'socket.io'
import { saveActivity } from './controllers/feedController'
import { endRefChallenge, startRefChallenge } from './crons/refChallCron'
import sendWeeklyEmail from './crons/weeklyEmail'
import errorhandler from './middleware/errorMiddleware'
import adminRoute from './routes/adminRoute'
import advertRoute from './routes/advertRoute'
import feedRoute from './routes/feedRoute'
import refRoute from './routes/refRoute'
import taskRoute from './routes/taskRoute'
import transactionRoute from './routes/transactionRoute'
import userRoute from './routes/userRoute'

/*  CONFIGURATIONS */
const app: Application = express()

const server = http.createServer(app)
const io = new Server(server, {
	path: '/socket.io',
	// cors: {
	//     origin: true,
	//     credentials: true
	// },
	// allowEIO3: true,
	// cors: {
	// 	origin: 'http://localhost:5173', 
	// 	credentials: true, 
	// },
	// allowEIO3: true,
});

dotenv.config()
app.use(express.json())
const corsOptions = {
    origin: ['https://www.belocated.ng','https://belocated.ng','https://urchin-app-nbzqm.ondigitalocean.app','https://api.flutterwave.com','https://www.flutterwave.com','https://api.korapay.com','https://www.korapay.com'],
    credentials: true,
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin',
    'User-Agent',
    'X-Custom-Header', 
    'headers'
  ],
	// This allows credentials (cookies) to be sent with the request
  };
  
  app.use(cors(corsOptions));
app.use(morgan('common'))
app.disable('x-powered-by')
app.use(cookieParser())


app.use(bodyParser.json({ limit: '30mb' }))

app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))

//app.use(helmet())
//app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

//Error middleware
app.use(errorhandler)

app.use('/api/user', userRoute)
app.use('/api/adverts', advertRoute)
app.use('/api/tasks', taskRoute)
app.use('/api/transactions', transactionRoute)
app.use('/api/activities', feedRoute)
app.use('/api/ref', refRoute)
app.use('/api/admin', adminRoute)

app.use(errors())

//Cron job schedule for weekly email
cron.schedule('0 17 * * 0', sendWeeklyEmail)
//sendWeeklyEmail()

//Cron job schedule to start referral Challenge
cron.schedule('0 0 * * 1', startRefChallenge) // Ref challenge kicks off every 12am monday morning
//cron.schedule('* * * * *', startRefChallenge) // Ref challenge starts  1min test
//startRefChallenge()

//Cron job schedule to end referral Challenge
cron.schedule('0 19 * * 0', endRefChallenge) // Ref challenge ends 7pm on sunday evening
//cron.schedule('* * * * *', endRefChallenge) // Ref challenge ends  1min test
//endRefChallenge()

io.on('connection', (socket) => {
	console.log(`User Connected: ${socket.id}`);

	// Listen for user ID and join the user-specific room
	socket.on('joinRoom', (userId) => {
		if (userId) {
			socket.join(userId); // Join a room with the user's ID
			console.log(`User ${userId} joined their room.`);
		}
	});

	// Listen for events coming from client
	socket.on('sendActivity', (data) => {
		// Save event to DB
		saveActivity(data);

		// Emit events back to all other clients
		socket.broadcast.emit('recievedActivity', data);
	});

	// Emit taskNotification to a specific user
	socket.on('taskNotification', (data) => {
		const { userId, message } = data;
		if (userId) {
			io.to(userId).emit('taskNotification', { message });
			console.log(`Notification sent to user ${userId}: ${message}`);
		}
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

// Allow CORS
server.prependListener('request', (req: Request, res: Response) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
});

export { server, io };

/*  MONGOOSE SETUP */
const PORT = process.env.PORT || 7001
mongoose
	.connect(process.env.MONGO_URI as string, {
		// useNewUrlParser: true,
		// useUnifiedTopology: true,
	})
	.then(() => {
		server.listen(PORT, () =>
			console.log(`Connection established on server Port: ${PORT}`),
		)
	})
	.catch((error) => console.log(`${error} did not connect`))





// 'https://belocated-admin.vercel.app',
			// 'https://urchin-app-nbzqm.ondigitalocean.app',
