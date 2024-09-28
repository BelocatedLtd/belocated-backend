"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const sendEmail = async (email, verificationToken) => {
    const data = {
        api_key: process.env.TERMII_API_KEY,
        email_address: email,
        code: verificationToken,
        email_configuration_id: process.env.TERMII_EMAIL_CONFIG_ID,
    };
    const options = {
        method: 'POST',
        url: 'https://api.ng.termii.com/api/email/otp/send',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
    };
    (0, axios_1.default)(options)
        .then((response) => {
        console.log(response.data);
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
};
exports.default = sendEmail;
//# sourceMappingURL=termilEmailSend.js.map