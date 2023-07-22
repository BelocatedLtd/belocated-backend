import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

const protect = asyncHandler(async (req, res, next) => {
    let token;

    token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.userId).select('-password');

            next();
        } catch (error) {
            res.status(401).json("Not Authorized, invalid token");;
            throw new Error('Not authorized, invalid token')
        }
    } else {
        res.status(401).json("Not Authorized, no token");
        throw new Error({message: 'Not Authorized, no token '})
    }
})

export default protect

