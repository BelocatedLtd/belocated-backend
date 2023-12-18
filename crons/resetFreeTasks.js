import User from "../model/User.js"
import mongoose from "mongoose";
import sendEMail from "../utils/sendEmail.js";
import Wallet from "../model/Wallet.js";
import Task from "../model/Task.js";
import Advert from "../model/Advert.js";
// import sendResetEmail from "./sendFreeTaskResetEmail.js";

// const resetFreeTasksCount = async() => {



//     try {
//         const users = await User.find();

//         // for (const user of users) {
//         //     user.freeTaskCount = 2;
//         //     await user.validate();
//         //     await user.save();
//         // }

//         //console.log("Weekly Tasks count reset successful for all users, sending notification emails...");

//         const emailSendingPromise = sendResetEmail()

//         await emailSendingPromise;
//        console.log("Email sending completed successfully.");

//     } catch (error) {
//         console.error("Error resetting free tasks count:", error);
//     }
// }

//  //resetFreeTasksCount();

// export default resetFreeTasksCount


const subject = 'Your Belocated Weekly Update';
const reply_to = "noreply@noreply.com";

const sendWeeklyEmail = async() => {
    const users = await User.find();
    const tasks = await Task.find();
    const ads = await Advert.find();
    const wallets = await Wallet.find();

    const runningAds = await ads?.filter(ad => ad?.status === "Running")
    
    
        for (const user of users) { 

            try {
            //const user = await User.findById("64c05449dbf0c02a5691427e");
            //const user = users.find(u => u._id == "64c05449dbf0c02a5691427e")
            const userEarned = wallets?.find(wallet => wallet?.userId == user?._id)?.totalEarning
            const userTaskCount = tasks?.filter(task => task?.taskPerformerId == user?._id )

            const message = `
            <p>Hi ${user?.username}</p> 
            <p>We are happy you are part of our Belocated Family.</p>
            <p>So far, you've earned  ₦${userEarned} doing ${userTaskCount?.length} tasks.</p>
            <p>This week is another opportuinity to earn much more</p>
            <p>We have over ${runningAds?.length} tasks available on the platform today.</p>
            <p>Head over to the platform <a href="https://belocated.ng">BeLocated platform</a> and start earning.</p>
            <p>Your satisfaction is our priority!</p>
            <p>Keep winning with BeLocated</p>
            <br/>
            <br/>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `

                 // Send the email
                await sendEMail(subject, message, user.email, reply_to)

                // Delay for 1 minute
                await new Promise(resolve => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute

                //console.log(message)

            } catch (error) {
                console.error(`Error sending email`, error);
            }
       }
}

//sendWeeklyEmail()

export default sendWeeklyEmail
