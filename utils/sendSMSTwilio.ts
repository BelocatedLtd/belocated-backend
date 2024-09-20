import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNTSID
const authToken = process.env.TWILIO_AUTHTOKEN
const verifySid = process.env.TWILIO_VERIFYSID

const client = twilio(accountSid, authToken)

export const sendVerification = (phone: string) => {
	try {
		if (!verifySid) {
			throw new Error('Verify SID is not defined')
		}
		client.verify.v2
			.services(verifySid)
			.verifications.create({
				to: phone,
				channel: 'sms',
			})
			.then((verification) => {
				if (verification.status === 'pending') {
					return 'OTP sent successfully'
				}
			})
	} catch (error) {
		console.log(error)
		return error
	}
}

export const verifyOTP = (phone: string, OTP: string) => {
	try {
		if (!verifySid) {
			throw new Error('Verify SID is not defined')
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
						return verification_check.status
					}
				}
			})
	} catch (error) {
		console.log(error)
		return error
	}
}
