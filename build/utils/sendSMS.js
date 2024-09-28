"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const url = process.env.TERMIL_BASE_URL;
const sendSMS = async (phone, message) => {
    const data = {
        to: phone,
        from: 'Belocated',
        sms: message,
        type: 'plain',
        api_key: process.env.TERMIL_KEY,
        channel: 'generic',
    };
    //body: JSON.stringify(data)
    try {
        const response = await axios_1.default.post(`https://api.ng.termii.com/api/sms/send`, JSON.stringify(data), {
            headers: {
                'Content-Type': ['application/json', 'application/json'],
            },
        });
        return response;
    }
    catch (error) {
        return { message: error };
    }
};
exports.default = sendSMS;
//# sourceMappingURL=sendSMS.js.map