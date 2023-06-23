import mongoose from "mongoose";

const FeedSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
})

const Feed = mongoose.model("Feed", FeedSchema)
export default Feed;