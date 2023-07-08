import asyncHandler from "express-async-handler"
import User from "../model/User.js"

const resetFreeTasksCount = async() => {

    try {
        const users = await User.find();

        for (const user of users) {
            user.freeTaskCount = 2;
            await user.validate();
            await user.save();
        }

        console.log("Weekly Tasks count reset successful for all users");
    } catch (error) {
        console.error("Error resetting free tasks count:", error);
    }
}

resetFreeTasksCount();

export default resetFreeTasksCount

