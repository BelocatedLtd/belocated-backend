import { SendMailClient } from 'zeptomail'

const url = 'api.zeptomail.com/'
const token =
	'Zoho-enczapikey wSsVR61w+UKmDfx/zzX7Ib1skVpUU1ikRxh9iwHwvyStH/uQpcczkELJVA6kG6MYRGU4R2EUpbMtmEpVg2YKiYkozw1SXiiF9mqRe1U4J3x17qnvhDzNX2xVlBGBJYgMww5tnWdkFMoq+g=='

let client = new SendMailClient({ url, token })

const sendEmail = async (
	subject: string,
	message: string,
	send_to: string,
	username: string,
) => {
	try {
		// Send the email
		const result = await client.sendMail({
			from: {
				address: 'noreply@belocated.ng',
				name: 'Belocated',
			},
			to: [
				{
					email_address: {
						address: send_to,
						name: username,
					},
				},
			],
			subject: subject,
			htmlbody: message,
		})
		console.log('🚀 ~ sendEmail ~ result:', result)

		console.log(`Message delivered Successfully to ${send_to}`)
		const response = `Message delivered Successfully to ${send_to}`
		return response
	} catch (error: any) {
		console.error(
			`Error sending email to ${send_to}: ${JSON.stringify(error, null, 2)}`,
		)
		const erorMessage = `Error sending email to ${send_to}: ${
			error?.message || error
		}`
	}
}

export default sendEmail
