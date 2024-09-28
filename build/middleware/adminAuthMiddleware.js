"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProtect = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../model/User"));
exports.adminProtect = (0, express_async_handler_1.default)(async (req, res, next) => {
    var _a;
    const authToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!authToken) {
        res.status(401).json({ message: 'Not Authorized, no token' });
        throw new Error('Not Authorized, no token');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
        if (!decoded) {
            res.status(401).json({ message: 'Session Expired, please login' });
            throw new Error('Session Expired, please login');
        }
        const user = await User_1.default.findById(decoded === null || decoded === void 0 ? void 0 : decoded.id).select('-password');
        if (!user) {
            res.status(401).json({ message: 'Not Authorized, user not found' });
            throw new Error('Not Authorized, user not found');
        }
        if (user.accountType !== 'Admin' && user.accountType !== 'Super Admin') {
            res.status(403).json({ message: 'Not Authorized, admin access only' });
            throw new Error('Not Authorized, admin access only');
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Not Authorized, invalid token' });
        throw new Error('Not authorized, invalid token');
    }
});
//# sourceMappingURL=adminAuthMiddleware.js.map