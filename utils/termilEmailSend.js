import axios from "axios"

const sendEmail = async ( email, verificationToken ) => {

    const data = {
        api_key: process.env.TERMIL_KEY,
        email_address: email,
        code: verificationToken,
        email_configuration_id: process.env.TERMIL_EMAIL_CONFIG_ID
    
      };

      try {
        const response = await axios.post('https://api.ng.termii.com/api/email/otp/send', JSON.stringify(data), {
        headers: {
            'Content-Type': ['application/json']
            }}
        )
        return response
      } catch (error) {
        return ({message: error})
      }
}

export default sendEmail