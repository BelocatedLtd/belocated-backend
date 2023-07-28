import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

export const protect = asyncHandler(async (req, res, next) => {

    const authToken = req.headers.authorization?.split(' ')[1];

    const authTokenCookie = req.cookies.token

    if (authToken) {
        try {
            const decoded = jwt.verify(authTokenCookie, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            res.status(401).json({message: "Not Authorized, invalid token"});;
            throw new Error('Not authorized, invalid token')
        }
    } else {
        res.status(401).json({message: "Not Authorized, no token"});
        throw new Error( 'Not Authorized, no token ')
    }
})

