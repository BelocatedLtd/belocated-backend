"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const getConfig = () => {
    return {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: Number(process.env.PORT) || 3000,
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        VERIFICATION_SECRET_KEY: process.env.VERIFICATION__SECRET__KEY,
        CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL,
        PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
        ZEPTO_HOST: process.env.ZEPTO_HOST,
        ZEPTO_USER: process.env.ZEPTO_USER,
        ZEPTO_PASS: process.env.ZEPTO_PASS,
        ZEPTO_TOKEN: process.env.ZEPTO_TOKEN,
        FLW_SECRET_HASH: process.env.FLW_SECRET_HASH,
        TWILIO_ACCOUNTSID: process.env.TWILIO_ACCOUNTSID,
        TWLIO_AUTHTOKEN: process.env.TWLIO_AUTHTOKEN,
        TWILIO_VERIFYSID: process.env.TWILIO_VERIFYSID,
        TERMII_API_KEY: process.env.TERMII_API_KEY,
        TERMII_EMAIL_CONFIG_ID: process.env.TERMII_EMAIL_CONFIG_ID,
        PUBLIC_ROUTES: [],
    };
};
const getSanitizedConfig = (config) => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in .env`);
        }
    }
    return config;
};
const config = getConfig();
const sanitizedConfig = getSanitizedConfig(config);
exports.default = sanitizedConfig;
//# sourceMappingURL=configSetup.js.map