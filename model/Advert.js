import mongoose from "mongoose"; 

const advertSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        required: true,
    },
    asset: {
        type: String,
        required: true,
    },
    desiredROI: {
        type: Number,
        required: true,
    },
    costPerTask: {
        type: Number,
        required: true,
    },
    earnPerTask: {
        type: Number,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    community: {
        type: String,
        required: true,
    },
    religion: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        required: true,
    },
    adAmount: {
        type: Number,
        required: true,
    },
    mediaURL: {
        type: Object,
        default: {},
    },
    socialPageLink: {
        type: String,
    },
    tasks: {
        type: Number, //Number of tasks completed so far, when it equals desiredROI, advert will be complete
        required: true,
    },
    status: {
        type: String, //Pending, Running, Allocating, Allocated, Completed
        required: true,
    },
   
}, {
    timestamps: true
})

const Advert = mongoose.model("Advert", advertSchema)
export default Advert;