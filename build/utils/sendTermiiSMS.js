"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const sendOTP = async (phone) => {
    const data = {
        api_key: process.env.TERMIL_KEY,
        message_type: 'NUMERIC',
        to: phone,
        from: 'N-Alert',
        channel: 'dnd',
        pin_attempts: 10,
        pin_time_to_live: 5,
        pin_length: 6,
        pin_placeholder: '<1234>',
        message_text: 'Your BELOCATED Confirmation code is <1234>, it Expires in 30 minutes',
        pin_type: 'NUMERIC',
    };
    const options = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    try {
        const response = await axios_1.default.post('https://api.ng.termii.com/api/sms/otp/send', data, options);
        return response.data;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.default = sendOTP;
//# sourceMappingURL=sendTermiiSMS.js.map