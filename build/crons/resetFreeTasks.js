"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Advert_js_1 = __importDefault(require("../model/Advert.js"));
const Task_js_1 = __importDefault(require("../model/Task.js"));
const User_js_1 = __importDefault(require("../model/User.js"));
const Wallet_js_1 = __importDefault(require("../model/Wallet.js"));
const sendEmail_js_1 = __importDefault(require("../utils/sendEmail.js"));
const subject = 'Your Belocated Weekly Update';
const reply_to = 'noreply@noreply.com';
const sendWeeklyEmail = async () => {
    var _a;
    const users = await User_js_1.default.find();
    const tasks = await Task_js_1.default.find();
    const ads = await Advert_js_1.default.find();
    const wallets = await Wallet_js_1.default.find();
    const runningAds = await (ads === null || ads === void 0 ? void 0 : ads.filter((ad) => (ad === null || ad === void 0 ? void 0 : ad.status) === 'Running'));
    for (const user of users) {
        try {
            //const user = await User.findById("64c05449dbf0c02a5691427e");
            //const user = users.find(u => u._id == "64c05449dbf0c02a5691427e")
            const userEarned = (_a = wallets === null || wallets === void 0 ? void 0 : wallets.find((wallet) => { var _a, _b; return ((_a = wallet === null || wallet === void 0 ? void 0 : wallet.userId) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = user === null || user === void 0 ? void 0 : user._id) === null || _b === void 0 ? void 0 : _b.toString()); })) === null || _a === void 0 ? void 0 : _a.totalEarning;
            const userTaskCount = tasks === null || tasks === void 0 ? void 0 : tasks.filter((task) => { var _a, _b; return ((_a = task === null || task === void 0 ? void 0 : task.taskPerformerId) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = user === null || user === void 0 ? void 0 : user._id) === null || _b === void 0 ? void 0 : _b.toString()); });
            const message = `
            <p>Hi ${user === null || user === void 0 ? void 0 : user.username}</p> 
            <p>We are happy you are part of our Belocated Family.</p>
            <p>So far, you've earned  ₦${userEarned} doing ${userTaskCount === null || userTaskCount === void 0 ? void 0 : userTaskCount.length} tasks.</p>
            <p>This week is another opportuinity to earn much more</p>
            <p>We have over ${runningAds === null || runningAds === void 0 ? void 0 : runningAds.length} tasks available on the platform today.</p>
            <p>Head over to the platform <a href="https://belocated.ng">BeLocated platform</a> and start earning.</p>
            <p>Your satisfaction is our priority!</p>
            <p>Keep winning with BeLocated</p>
            <br/>
            <br/>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `;
            // Send the email
            await (0, sendEmail_js_1.default)(subject, message, user.email, reply_to);
            // Delay for 1 minute
            await new Promise((resolve) => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute
            //console.log(message)
        }
        catch (error) {
            console.error(`Error sending email`, error);
        }
    }
};
//sendWeeklyEmail()
exports.default = sendWeeklyEmail;
//# sourceMappingURL=resetFreeTasks.js.map