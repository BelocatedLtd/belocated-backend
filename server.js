import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import {fileURLToPath} from 'url'
import cookieParser from 'cookie-parser'
import userRoute from './routes/userRoute.js'
import advertRoute from './routes/advertRoute.js'
import taskRoute from './routes/taskRoute.js'
import transactionRoute from './routes/transactionRoute.js'
import errorHandler from './middleware/errorMiddleware.js'
import cron from 'node-cron'
import resetFreeTasks from './crons/resetFreeTasks.js'




/*  CONFIGURATIONS */
const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}));
app.use(morgan("common"));
app.disable('x-powered-by');
app.use(bodyParser.json({limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin"}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Error middleware
app.use(errorHandler);


/*  ROUTES WITH FILES */
app.get('/', (req, res) => {
    res.status(201).json("This is phome")})

app.use("/api/user", userRoute)
app.use("/api/adverts", advertRoute)
app.use("/api/tasks", taskRoute)
app.use("/api/transactions", transactionRoute)

//Cron job schedule
cron.schedule('0 0 * * 0', resetFreeTasks)

/*  MONGOOSE SETUP */
const PORT = process.env.PORT || 7001;
mongoose.connect(process.env.MONGO_URI, 
    {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
).then(() => {
    app.listen(PORT, () => console.log(`Connection established on server Port: ${PORT}`));
}).catch((error) => console.log(`${error} did not connect`));