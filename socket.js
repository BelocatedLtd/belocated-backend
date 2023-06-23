import {Server} from 'socket.io'
import Feed from './model/Feed.js'
import asyncHandler from "express-async-handler";

export const handleConnection = (socket) => {
    console.log('A user connected');

    //Listens and captures emitted events from the frontend
    socket.on('activity', (data) => {

        //save the activity to the db
        const newActivity = new Feed({
            userId: data.userId,
            action: data.action,
        });

        console.log(newActivity)

        //
        newActivity.save((err) => {
            if (err) {
                console.log('Error saving activity', err);
            }
        });

        //Emit the activity to all connected clients in the frontend
        socket.emit('activity', data);
    });

    //Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
}