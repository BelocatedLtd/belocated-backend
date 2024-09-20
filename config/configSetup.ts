import * as dotenv from 'dotenv'

dotenv.config()

type Config = {
	NODE_ENV: string
	PORT: number
	MONGO_URI: string
	JWT_SECRET: string
	VERIFICATION_SECRET_KEY: string
	CLOUDINARY_NAME: string
	CLOUDINARY_API_KEY: string
	CLOUDINARY_API_SECRET: string
	FRONTEND_URL: string
	PAYSTACK_SECRET_KEY: string
	ZEPTO_HOST: string
	ZEPTO_USER: string
	ZEPTO_PASS: string
	ZEPTO_TOKEN: string
	FLW_SECRET_HASH: string
	TWILIO_ACCOUNTSID: string
	TWLIO_AUTHTOKEN: string
	TWILIO_VERIFYSID: string
	TERMII_API_KEY: string
	TERMII_EMAIL_CONFIG_ID: string
	PUBLIC_ROUTES: string[]
}

const getConfig = (): Config => {
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
	}
}

const getSanitizedConfig = (config: Config) => {
	for (const [key, value] of Object.entries(config)) {
		if (value === undefined) {
			throw new Error(`Missing key ${key} in .env`)
		}
	}
	return config as Config
}

const config = getConfig()
const sanitizedConfig = getSanitizedConfig(config)

export default sanitizedConfig
