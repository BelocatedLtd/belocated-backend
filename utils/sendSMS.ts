import axios from 'axios'

const url = process.env.TERMIL_BASE_URL

const sendSMS = async (phone: string, message: string) => {
	const data = {
		to: phone,
		from: 'Belocated',
		sms: message,
		type: 'plain',
		api_key: process.env.TERMIL_KEY,
		channel: 'generic',
	}

	//body: JSON.stringify(data)

	try {
		const response = await axios.post(
			`https://api.ng.termii.com/api/sms/send`,
			JSON.stringify(data),
			{
				headers: {
					'Content-Type': ['application/json', 'application/json'],
				},
			},
		)
		return response
	} catch (error) {
		return { message: error }
	}
}

export default sendSMS
