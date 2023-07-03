import twilio from 'twilio'

const accountSid = "ACe10b0b4673a05fd64a6a465abe4e2438";
const authToken = "dc6684ec09d44b67df02aee2c420731b";
const verifySid = "VA0db4626ae6c1d17ded26227fb0f4d9a6";

const client = twilio(accountSid, authToken);

export const sendVerification = (phone) => {
    try {
        client.verify.v2
        .services(verifySid)
        .verifications.create(
            { 
                to: phone, 
                channel: "sms" 
            })
        .then((verification) => {
            if (verification.status === "pending") {
                return "OTP sent successfully"
            }
        }
        )
    } catch (error) {
        console.log(error)
        return error
    }
}


export const verifyOTP = (phone, OTP) => {
    try{
        client.verify.v2
        .services(verifySid)
        .verificationChecks.create(
            { 
                to: phone, 
                code: OTP 
            })
        .then((verification_check) => {
            {
                if (verification_check.status === "approved") {
                    return verification_check.status
                }
            }
        })
    } catch {
        console.log(error)
        return error
    }
}
