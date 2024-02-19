import { SendMailClient } from "zeptomail";
import User from "../model/User.js"
import Wallet from "../model/Wallet.js";
import Task from "../model/Task.js";
import Advert from "../model/Advert.js";

const url = "api.zeptomail.com/";
const token = "Zoho-enczapikey wSsVR61w+UKmDfx/zzX7Ib1skVpUU1ikRxh9iwHwvyStH/uQpcczkELJVA6kG6MYRGU4R2EUpbMtmEpVg2YKiYkozw1SXiiF9mqRe1U4J3x17qnvhDzNX2xVlBGBJYgMww5tnWdkFMoq+g==";

let client = new SendMailClient({url, token});

const sendWeeklyEmail = async() => {

const users = await User.find();
const tasks = await Task.find();
const ads = await Advert.find();
const wallets = await Wallet.find();

const runningAds = await ads?.filter(ad => ad?.status === "Running")

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
        //  client.sendMail({
        //     "from": 
        //     {
        //         "address": "noreply@belocated.ng",
        //         "name": "Belocated"
        //     },
        //     "to": 
        //     [
        //         {
        //         "email_address": 
        //             {
        //                 "address": user?.email,
        //                 "name": user?.username
        //             }
        //         }
        //     ],
        //     "subject": "Your Belocated Weekly Update",
        //     "htmlbody": message,
        // }).then((res) => console.log(`Message delivered Successfully ${user.email}`)).catch((error) => console.log(`There was an error ${user.email}`));

    //     const message = `
    // <p>Hi ${user?.username}</p> 
    // <p>We are happy you are part of our Belocated Family.</p>
    // <p>So far, you've earned  ₦${user.userEarned} doing ${user.userTaskCount} tasks.</p>
    // <p>This week is another opportuinity to earn much more</p>
    // <p>We have over ${user.runningAds} tasks available on the platform today.</p>
    // <p>Head over to the platform <a href="https://belocated.ng">BeLocated platform</a> and start earning.</p>
    // <p>Your satisfaction is our priority!</p>
    // <p>Keep winning with BeLocated</p>
    // <br/>
    // <br/>

    // <p>Regards,</p>
    // <p>Belocated Team</p>
   // `
        
        try {
            // Send the email
            const result = await client.sendMail({
                "from": {
                    address: "noreply@belocated.ng",
                    name: "Belocated"
                },
                "to": [
                    {
                        email_address: {
                            address: user?.email,
                            name: user?.username
                        }
                    }
                ],
                "subject": "Your Belocated Weekly Update",
                "htmlbody": message,
            });

            console.log(`Message delivered Successfully to ${user.email}`);
        } catch (error) {
            console.error(`Error sending email to ${user.email}: ${error.message}`);
        }

}

    }

    export default sendWeeklyEmail

