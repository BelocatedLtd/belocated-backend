"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_js_1 = __importDefault(require("../model/User.js"));
const sendEmail_js_1 = __importDefault(require("../utils/sendEmail.js"));
const subject = 'Your Belocated Weekly Update';
const reply_to = "noreply@noreply.com";
const sendResetEmail = async () => {
    const users = await User_js_1.default.find();
    for (const user of users) {
        const message = `
            <p>Hi ${user.username}</p>
            <p>Happy new week!</p>
            <p>We are happy you are part of our Belocated Family.</p>
            <p>So far, you've earned N${600} doing ${30} tasks.</p>
            <p>This week is another opportuinity to earn much more</p>
            <p>We have over ${2000} tasks available on the platform today.</p>
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
            await (0, sendEmail_js_1.default)(subject, message, user.email, reply_to);
            // Delay for 1 minute
            await new Promise(resolve => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute
        }
        catch (error) {
            console.error(`Error sending email to ${user.email}:`, error);
        }
    }
};
exports.default = sendResetEmail;
//# sourceMappingURL=sendFreeTaskResetEmail.js.map