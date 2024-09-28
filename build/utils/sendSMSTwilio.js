"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.sendVerification = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNTSID;
const authToken = process.env.TWILIO_AUTHTOKEN;
const verifySid = process.env.TWILIO_VERIFYSID;
const client = (0, twilio_1.default)(accountSid, authToken);
const sendVerification = (phone) => {
    try {
        if (!verifySid) {
            throw new Error('Verify SID is not defined');
        }
        client.verify.v2
            .services(verifySid)
            .verifications.create({
            to: phone,
            channel: 'sms',
        })
            .then((verification) => {
            if (verification.status === 'pending') {
                return 'OTP sent successfully';
            }
        });
    }
    catch (error) {
        console.log(error);
        return error;
    }
};
exports.sendVerification = sendVerification;
const verifyOTP = (phone, OTP) => {
    try {
        if (!verifySid) {
            throw new Error('Verify SID is not defined');
        }
        client.verify.v2
            .services(verifySid)
            .verificationChecks.create({
            to: phone,
            code: OTP,
        })
            .then((verification_check) => {
            {
                if (verification_check.status === 'approved') {
                    return verification_check.status;
                }
            }
        });
    }
    catch (error) {
        console.log(error);
        return error;
    }
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=sendSMSTwilio.js.map