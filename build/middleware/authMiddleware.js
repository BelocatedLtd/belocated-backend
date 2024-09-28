"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../model/User"));
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    var _a;
    const authToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    console.log('🚀 ~ protect ~ authToken:', authToken);
    // console.log(authToken)
    // return
    if (!authToken) {
        throw new Error('Not Authorized, no token ');
    }
    try {
        console.log('🚀 ~ process.env.JWT_SECRET:', process.env.JWT_SECRET);
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
        console.log('🚀 ~ decoded:', decoded);
        if (!decoded) {
            throw new Error('Session Expired, please login');
        }
        req.user = await User_1.default.findById(decoded.id).select('-password');
        next();
    }
    catch (error) {
        res.status(401).json({ message: error });
    }
});
//# sourceMappingURL=authMiddleware.js.map