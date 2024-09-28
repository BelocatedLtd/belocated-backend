"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const celebrate_1 = require("celebrate");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const feedController_1 = require("./controllers/feedController");
const refChallCron_1 = require("./crons/refChallCron");
const weeklyEmail_1 = __importDefault(require("./crons/weeklyEmail"));
const errorMiddleware_1 = __importDefault(require("./middleware/errorMiddleware"));
const adminRoute_1 = __importDefault(require("./routes/adminRoute"));
const advertRoute_1 = __importDefault(require("./routes/advertRoute"));
const feedRoute_1 = __importDefault(require("./routes/feedRoute"));
const refRoute_1 = __importDefault(require("./routes/refRoute"));
const taskRoute_1 = __importDefault(require("./routes/taskRoute"));
const transactionRoute_1 = __importDefault(require("./routes/transactionRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
/*  CONFIGURATIONS */
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: '/socket.io',
    // cors: {
    //     origin: true,
    //     credentials: true
    // },
    // allowEIO3: true,
});
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, morgan_1.default)('common'));
app.disable('x-powered-by');
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
}));
app.use(body_parser_1.default.json({ limit: '30mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '30mb', extended: true }));
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
//Error middleware
app.use(errorMiddleware_1.default);
app.use('/api/user', userRoute_1.default);
app.use('/api/adverts', advertRoute_1.default);
app.use('/api/tasks', taskRoute_1.default);
app.use('/api/transactions', transactionRoute_1.default);
app.use('/api/activities', feedRoute_1.default);
app.use('/api/ref', refRoute_1.default);
app.use('/api/admin', adminRoute_1.default);
app.use((0, celebrate_1.errors)());
//Cron job schedule for weekly email
node_cron_1.default.schedule('0 17 * * 0', weeklyEmail_1.default);
//sendWeeklyEmail()
//Cron job schedule to start referral Challenge
node_cron_1.default.schedule('0 0 * * 1', refChallCron_1.startRefChallenge); // Ref challenge kicks off every 12am monday morning
//cron.schedule('* * * * *', startRefChallenge) // Ref challenge starts  1min test
//startRefChallenge()
//Cron job schedule to end referral Challenge
node_cron_1.default.schedule('0 19 * * 0', refChallCron_1.endRefChallenge); // Ref challenge ends 7pm on sunday evening
//cron.schedule('* * * * *', endRefChallenge) // Ref challenge ends  1min test
//endRefChallenge()
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);
    // Listen for events coming from client
    socket.on('sendActivity', (data) => {
        //Save event to db
        (0, feedController_1.saveActivity)(data);
        //Emit events back to client
        socket.broadcast.emit('recievedActivity', data);
    });
    //Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});
server.prependListener('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
});
/*  MONGOOSE SETUP */
const PORT = process.env.PORT || 7001;
mongoose_1.default
    .connect(process.env.MONGO_URI, {
// useNewUrlParser: true,
// useUnifiedTopology: true,
})
    .then(() => {
    server.listen(PORT, () => console.log(`Connection established on server Port: ${PORT}`));
})
    .catch((error) => console.log(`${error} did not connect`));
//# sourceMappingURL=app.js.map