declare module 'zeptomail' {
	interface EmailAddress {
		address: string
		name: string
	}

	interface SendMailOptions {
		from: EmailAddress
		to: {
			email_address: EmailAddress
		}[]
		subject: string
		htmlbody: string
	}

	export class SendMailClient {
		constructor(config: { url: string; token: string })
		sendMail(
			options: SendMailOptions,
		): Promise<{ success: boolean; message: string }>
	}
}
