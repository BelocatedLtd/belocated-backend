import axios from "axios"

const sendOTP = async(phone) => {
  const data = {
    "api_key": process.env.TERMIL_KEY,
    "message_type": "NUMERIC",
    "to": phone,
    "from": "Belocated",
    "channel": "generic",
    "pin_attempts": 10,
    "pin_time_to_live": 5,
    "pin_length": 6,
    "pin_placeholder": "<1234>",
    "message_text": "Your verification pin is <1234>",
    "pin_type": "NUMERIC"
  };

  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.post('https://api.ng.termii.com/api/sms/otp/send', data, options);
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
}

export default sendOTP
