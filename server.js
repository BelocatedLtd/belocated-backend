import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'

import cors from 'cors'
import http from 'http'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import {fileURLToPath} from 'url'
import cookieParser from 'cookie-parser'
import userRoute from './routes/userRoute.js'
import advertRoute from './routes/advertRoute.js'
import taskRoute from './routes/taskRoute.js'
import refRoute from './routes/refRoute.js'
import transactionRoute from './routes/transactionRoute.js'
import feedRoute from './routes/feedRoute.js'
import errorHandler from './middleware/errorMiddleware.js'
import {Server} from 'socket.io'
import cron from 'node-cron'
import { saveActivity } from './controllers/feedController.js'
import sendWeeklyEmail from './crons/weeklyEmail.js'
import {startRefChallenge, endRefChallenge } from './crons/refChallCron.js'


/*  CONFIGURATIONS */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket.io',
    // cors: {
    //     origin: true,
    //     credentials: true
    // },
    // allowEIO3: true,
});

dotenv.config();
app.use(express.json());


app.use(morgan("common"));
app.disable('x-powered-by');
app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}));
app.use(bodyParser.json({limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin"}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//Error middleware
app.use(errorHandler); 

app.use("/api/user", userRoute)
app.use("/api/adverts", advertRoute)
app.use("/api/tasks", taskRoute)
app.use("/api/transactions", transactionRoute)
app.use("/api/activities", feedRoute)
app.use("/api/ref", refRoute)


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


io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`)

    // Listen for events coming from client
    socket.on("sendActivity", (data) => {

        //Save event to db
        saveActivity(data)

        //Emit events back to client
        socket.broadcast.emit("recievedActivity", data)
    })

     //Handle disconnection
     socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
})

server.prependListener('request', (req,res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
})

/*  MONGOOSE SETUP */
const PORT = process.env.PORT || 7001;
mongoose.connect(process.env.MONGO_URI, 
    {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
).then(() => {
    server.listen(PORT, () => console.log(`Connection established on server Port: ${PORT}`));
}).catch((error) => console.log(`${error} did not connect`));