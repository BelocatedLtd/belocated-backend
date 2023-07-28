import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

export const protect = asyncHandler(async (req, res, next) => {

    const authToken = req.headers.authorization?.split(' ')[1];

    if(!authToken) {
        res.status(401).json({message: "Not Authorized, no token"});
        throw new Error( 'Not Authorized, no token ')
    }

    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select('-password');

        next();
    } catch (error) {
        res.status(401).json({message: "Not Authorized, invalid token"});;
        throw new Error('Not authorized, invalid token')
    }
})

