export {}

declare global {
	namespace Express {
		export interface Request {
			user?: any
			admin?: any
			query?: any
		}
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: string
			PORT: string
			SSL: string
			JWT_SECRET: string
			JWT_EXPIRY_TIME: string
			VERIFICATION__SECRET__KEY: string
			DBNAME: string
			DBUSERNAME: string
			DBPASSWORD: string
			DBHOST: string
			DBPORT: string
			DBDIALECT: string
			MONGO_URI: string
			MAIL_FROM: string
			SUPPORT_MAIL: string
			SUPPORT_PHONE: string
			MAIL_FROM_NAME: string
			LOGO: string
			WEBSITE: string
			BASE_API_URL: string
			SENDGRID_API_KEY: string
			IP_API_URL: string
			CLOUDINARY_NAME: string
			CLOUDINARY_API_KEY: string
			CLOUDINARY_API_SECRET: string
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
			IDENTITYPASS_LIVE_BASE_URL: string
			IDENTITYPASS_SANDBOX_BASE_URL: string
			IDENTITYPASS_X_API_KEY: string
			IDENTITYPASS_APP_ID: string
			PUBLIC_ROUTES: string
			FRONTEND_URL: string
		}
	}
}
