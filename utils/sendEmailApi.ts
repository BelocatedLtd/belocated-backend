import { SendMailClient } from 'zeptomail'

const url = 'api.zeptomail.com/'
const token =
	'Zoho-enczapikey wSsVR61+/ULyWvt/yTGrLu85mQgBVAukQ0943gSlvn/+HvvL/MduxUDOBQenTqBOGDRsRjdBoL4hnR4FgDtY2dt+wlBUWiiF9mqRe1U4J3x17qnvhDzMWW9dkRWOKYgKxQ1okmhgG8oi+g=='

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
