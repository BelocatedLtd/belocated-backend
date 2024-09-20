import axios from 'axios'

const sendEmail = async (email: string, verificationToken: string) => {
	const data = {
		api_key: process.env.TERMII_API_KEY,
		email_address: email,
		code: verificationToken,
		email_configuration_id: process.env.TERMII_EMAIL_CONFIG_ID,
	}

	const options = {
		method: 'POST',
		url: 'https://api.ng.termii.com/api/email/otp/send',
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify(data),
	}

	axios(options)
		.then((response) => {
			console.log(response.data)
			return response.data
		})
		.catch((error) => {
			console.log(error)
		})
}

export default sendEmail
