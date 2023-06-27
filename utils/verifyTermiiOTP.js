import axios from "axios"

const verifyOTP = async (pinId, OTP) => {

  const data = {
    "api_key": process.env.TERMIL_KEY,
    "pin_id": pinId,
    "pin": OTP
  };

  console.log(data)

  

  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.post('https://api.ng.termii.com/api/sms/otp/verify', data, options);
    return response.data;
  } catch (error) {
    throw new Error(error)
  }
}

export default verifyOTP
