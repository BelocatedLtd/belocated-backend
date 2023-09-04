import User from "../model/User.js"
import mongoose from "mongoose";
import sendResetEmail from "./sendFreeTaskResetEmail.js";

const resetFreeTasksCount = async() => {

    try {
        const users = await User.find();

        for (const user of users) {
            user.freeTaskCount = 2;
            await user.validate();
            await user.save();
        }

        console.log("Weekly Tasks count reset successful for all users, sending notification emails...");

        const emailSendingPromise = sendResetEmail()

        await emailSendingPromise;
       console.log("Email sending completed successfully.");

    } catch (error) {
        console.error("Error resetting free tasks count:", error);
    }
}

 //resetFreeTasksCount();

export default resetFreeTasksCount

