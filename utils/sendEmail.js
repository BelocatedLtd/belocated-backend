import nodemailer from "nodemailer"
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from 'dotenv'

dotenv.config();


//import mg from 'nodemailer-mailgun-transport'

const API_KEY = process.env.MAILGUN_API_KEY;
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