import asyncHandler from "express-async-handler"
import User from "../model/User.js"
import sendEMail from "../utils/sendEmail.js";

const resetFreeTasksCount = async() => {

    
        const subject = 'Gain Access To This Weeks Paid Task On Belocated!'
        //const send_to = 'mail2jhenry@gmail.com'
        const reply_to = "noreply@noreply.com"


    try {
        const users = await User.find();

        for (const user of users) {
            user.freeTaskCount = 2;
            await user.validate();
            await user.save();

            //Finally sending email

            const message = `
            <p>Hello ${user.username}</p>
            <p>It's a new week and your free task clock has reset.</p>
            <p>Proceed to the <a href="https://belocated.ng">BeLocated platform</a> to complete your 2 free task and gain access to numerous paid tasks this week.</p>
            <p>Keep winning with BeLocated</p>
            <br/>
            <br/>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `

            const emailSent = await sendEMail(subject, message, user.email, reply_to)

            if (!emailSent) {
                res.status(500).json('Email sending failed');
                throw new Error('Email sending failed') 
            }
        }

        console.log("Weekly Tasks count reset successful for all users");

    } catch (error) {
        console.error("Error resetting free tasks count:", error);
    }
}

 //resetFreeTasksCount();

export default resetFreeTasksCount

