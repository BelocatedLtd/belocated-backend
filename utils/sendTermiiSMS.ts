import axios from 'axios'

const sendOTP = async (phone: string) => {
	const data = {
		api_key: process.env.TERMIL_KEY,
		message_type: 'NUMERIC',
		to: phone,
		from: 'N-Alert',
		channel: 'dnd',
		pin_attempts: 10,
		pin_time_to_live: 5,
		pin_length: 6,
		pin_placeholder: '<1234>',
		message_text:
			'Your BELOCATED Confirmation code is <1234>, it Expires in 30 minutes',
		pin_type: 'NUMERIC',
	}

	const options = {
		headers: {
			'Content-Type': 'application/json',
		},
	}

	try {
		const response = await axios.post(
			'https://api.ng.termii.com/api/sms/otp/send',
			data,
			options,
		)
		return response.data
	} catch (error) {
		throw new Error(error as any)
	}
}

export default sendOTP
