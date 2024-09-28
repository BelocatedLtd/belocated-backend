"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zeptomail_1 = require("zeptomail");
const Advert_1 = __importDefault(require("../model/Advert"));
const Task_1 = __importDefault(require("../model/Task"));
const User_1 = __importDefault(require("../model/User"));
const Wallet_1 = __importDefault(require("../model/Wallet"));
const url = 'api.zeptomail.com/';
const token = 'Zoho-enczapikey wSsVR61w+UKmDfx/zzX7Ib1skVpUU1ikRxh9iwHwvyStH/uQpcczkELJVA6kG6MYRGU4R2EUpbMtmEpVg2YKiYkozw1SXiiF9mqRe1U4J3x17qnvhDzNX2xVlBGBJYgMww5tnWdkFMoq+g==';
let client = new zeptomail_1.SendMailClient({ url, token });
const sendWeeklyEmail = async () => {
    var _a;
    const users = await User_1.default.find();
    const tasks = await Task_1.default.find();
    const ads = await Advert_1.default.find();
    const wallets = await Wallet_1.default.find();
    const runningAds = await (ads === null || ads === void 0 ? void 0 : ads.filter((ad) => (ad === null || ad === void 0 ? void 0 : ad.status) === 'Running'));
    // const users = [
    //     {
    //         _id: "64c05449dbf0c02a5691427e",
    //         username: "user1",
    //         email: "mail2jhenry@gmail.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a5691427f",
    //         username: "user2",
    //         email: "mailjayhenry@gmail.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914280",
    //         username: "user3",
    //         email: "mirrorsng@gmail.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914281",
    //         username: "user4",
    //         email: "jayveloper@stackithub.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914282",
    //         username: "user5",
    //         email: "jayclinics@gmail.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914283",
    //         username: "user6",
    //         email: "stackithub@gmail.com",
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914284",
    //         username: "user7",
    //         email: "mail2jhenry@gmail.com", // Duplicate email for testing
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    //     {
    //         _id: "64c05449dbf0c02a56914285",
    //         username: "user8",
    //         email: "nonexistent@email.com", // Testing with a nonexistent email
    //         userTaskCount: generateRandomNumber(),
    //         userEarned: generateRandomNumber(),
    //         runningAds: generateRandomNumber(),
    //     },
    // ];
    // function generateRandomNumber() {
    //     return Math.floor(Math.random() * 10) + 1; // Generates a random number between 1 and 10
    // }
    for (const user of users) {
        //const user = await User.findById("64c05449dbf0c02a5691427e");
        //const user = users.find(u => u._id == "64c05449dbf0c02a5691427e")
        const userEarned = (_a = wallets === null || wallets === void 0 ? void 0 : wallets.find((wallet) => (wallet === null || wallet === void 0 ? void 0 : wallet.userId) == (user === null || user === void 0 ? void 0 : user._id.toString()))) === null || _a === void 0 ? void 0 : _a.totalEarning;
        const userTaskCount = tasks === null || tasks === void 0 ? void 0 : tasks.filter((task) => (task === null || task === void 0 ? void 0 : task.taskPerformerId) == (user === null || user === void 0 ? void 0 : user._id.toString()));
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
        try {
            // Send the email
            const result = await client.sendMail({
                from: {
                    address: 'noreply@belocated.ng',
                    name: 'Belocated',
                },
                to: [
                    {
                        email_address: {
                            address: user === null || user === void 0 ? void 0 : user.email,
                            name: user === null || user === void 0 ? void 0 : user.username,
                        },
                    },
                ],
                subject: 'Your Belocated Weekly Update',
                htmlbody: message,
            });
            console.log(`Message delivered Successfully to ${user.email}`);
        }
        catch (error) {
            console.error(`Error sending email to ${user.email}: ${error}`);
        }
    }
};
exports.default = sendWeeklyEmail;
//# sourceMappingURL=weeklyEmail.js.map