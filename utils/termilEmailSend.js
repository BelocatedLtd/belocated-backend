import axios from "axios"

const sendEmail = async ( email, verificationToken ) => {

    const data = {
      "api_key": 'TLE785crMGBJDeQQX3q14wI2bVtlKwuxMDBPY5m5AD6sHuqLyS6UU32sm51PlB',
      "email_address": email,
      "code": verificationToken,
      "email_configuration_id": '9994bfc7-827b-47b4-bb02-f302be3f5063'
    };

    const options = {
      method: 'POST',
      url: 'https://api.ng.termii.com/api/email/otp/send',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    };

    axios(options)
      .then(response => {
        console.log(response.data);
        return response.data
      })
      .catch(error => {
       console.log(error)
      });

}

export default sendEmail