"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const verifyOTP = async (pinId, OTP) => {
    const data = {
        api_key: process.env.TERMIL_KEY,
        pin_id: pinId,
        pin: OTP,
    };
    console.log(data);
    const options = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    try {
        const response = await axios_1.default.post('https://api.ng.termii.com/api/sms/otp/verify', data, options);
        return response.data;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.default = verifyOTP;
//# sourceMappingURL=verifyTermiiOTP.js.map