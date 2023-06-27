import twilio from 'twilio'

const accountSid = "AC4b0cc3cdec88648268740e316b04a715";
const authToken = "3a2aa6f1cd28865dcc607162c96b9feb";
const verifyService = "VA0db4626ae6c1d17ded26227fb0f4d9a6";

const client = twilio(accountSid, authToken);

export const sendVerification = (phone) => {
    client.verify.v2.services(verifyService)
    .verifications
    .create({to: phone, channel: 'sms'})
    .then(verification => {
        console.log(verification)
        return verification
    })
    .catch(error => {
        console.log(error)
        return error
    })
}

export const verifyOTP = (phone, OTP) => {
    client.verify.v2.services(verifyService)
    .verificationChecks
    .create({to: phone, code: OTP})
    .then(verificationCheck => {
        if (verificationCheck.status === 'approved') {
            console.log('Verification successful')
            return verificationCheck
        } else {
            console.log('Verification Failed')
        }
    })
    .catch(error => {
        console.log(error)
        return error
    })
}
