import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

const protect = asyncHandler(async (req, res, next) => {
    let authToken;

    authToken = req.cookies.token;

    if (authToken) {
        try {
            //Get token from the bearer

            //token = req.header.authorization.split(' ')[1]
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

            //Get user from token

            req.user = await User.findById(decoded.id).select('-password');

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

