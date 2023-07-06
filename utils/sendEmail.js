import nodemailer from "nodemailer"
import formData from 'form-data';
import Mailgun from 'mailgun.js';


//import mg from 'nodemailer-mailgun-transport'

const API_KEY = '49fc01aab5a7282b28de67edd833f5fa-e5475b88-c8344dc2';
const DOMAIN = 'mail.belocated.ng';


const mailgun = new Mailgun(formData);
const client = mailgun.client({username: 'api', key: API_KEY});

const sendEMail = async(subject, message, send_to, reply_to)  => {
    const messageData = {
        from: 'Belocated <cs@belocated.ng>',
        to: send_to,
        subject: subject,
        html: message
      };

    try {
          const res = client.messages.create(DOMAIN, messageData)
          console.log(res)
          return res
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

export default sendEMail