import { SendMailClient } from "zeptomail";
import User from "../model/User.js"
import Wallet from "../model/Wallet.js";
import Task from "../model/Task.js";
import Advert from "../model/Advert.js";

const url = "api.zeptomail.com/";
const token = process.env.ZEPTO_TOKEN;

let client = new SendMailClient({url, token});

const sendWeeklyEmail = async() => {

const users = await User.find();
const tasks = await Task.find();
const ads = await Advert.find();
const wallets = await Wallet.find();

const runningAds = await ads?.filter(ad => ad?.status === "Running")

for (const user of users) { 

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
         client.sendMail({
            "from": 
            {
                "address": "noreply@belocated.ng",
                "name": "Belocated"
            },
            "to": 
            [
                {
                "email_address": 
                    {
                        "address": user.email,
                        "name": user.username
                    }
                }
            ],
            "subject": "Your Belocated Weekly Update",
            "htmlbody": message,
        }).then((resp) => console.log(`Email successfully sent to ${user.email}`)).catch((error) => console.log(`Error sending email to ${user.email}`));

        
        // Delay for 1 minute
        await new Promise(resolve => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute

}

    }

    export default sendWeeklyEmail

