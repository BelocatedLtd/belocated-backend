import mongoose from "mongoose";

const TaskSchema = mongoose.Schema({
    advertId: {
        type: String,
        required: true,
    },
    advertiserId: {
        type: String,
        required: true,
    },
    taskPerformerId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    platform: {
        type: String, //whatsApp, Facebook, IG, Twitter and Tiktok
        required: true,
    },
    service: {
        type: String,
        required: true,
    },
    desiredROI: {
        type: String, // no. of advert posts you expect to get
        required: true,
    },
    toEarn: {
        type: Number, // Amount to earn after performing a task
        required: true,
    },
    gender: {
        type: String, // Male, Female, Both
        required: true,
    },
    state: {
        type: String, 
        required: true,
    },
    lga: {
        type: String, 
        required: true,
    },
    caption: { 
        type: String 
    },
    taskVerification: {
        type: String, 
        required: true,
    },
    socialPageLink: {
        type: String, 
    },
    proofOfWorkMediaURL: [
        {
          secure_url: { type: String },
          public_id: { type: String },
        }
    ],
    nameOnSocialPlatform: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        default: "Awaiting Submission", // Submitted, Pending Approval, Approved, Rejected
    },
    adMedia: {
        type: Array
    },
    message: {
        type: String,
        default: "", // Take the message that conveys the reason why Admin rejected task submission
    }

}, {
    timestamps: true
})

const Task = mongoose.model("Task", TaskSchema)
export default Task;