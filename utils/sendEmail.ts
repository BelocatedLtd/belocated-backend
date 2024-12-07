import nodemailer from 'nodemailer'
// import Mailgun from 'mailgun.js';
import dotenv from 'dotenv'

dotenv.config()

//import mg from 'nodemailer-mailgun-transport'

// const API_KEY = process.env.MAILGUN_API_KEY;
// const DOMAIN = 'mail.belocated.ng';

const HOST = process.env.EMAIL_HOST
const USER = process.env.EMAIL_USER
const PASS = process.env.EMAIL_PASS

console.log('🚀 ~ HOST:', { HOST, USER, PASS })

var transport = nodemailer.createTransport({
	host: HOST,
	port: 587,
	auth: {
		user: USER,
		pass: PASS,
	},
})

// const mailgun = new Mailgun(formData);
// const client = mailgun.client({username: 'api', key: API_KEY});

// const sendEMail = async(subject, message, send_to, reply_to)  => {
//     const messageData = {
//         from: 'Belocated <cs@belocated.ng>',
//         to: send_to,
//         subject: subject,
//         html: message
//       };

//     try {
//           const res = client.messages.create(DOMAIN, messageData)
//           console.log(res)
//           return res
//     } catch (error) {
//         console.log(error)
//         throw new Error(error)
//     }
// }

const sendEmail = async (subject: string, message: string, send_to: string, reply_to: string) => {
	var mailOptions = {
		from:'"Belocated" <cs@belocated.ng>',
		to: send_to,
		subject: subject,
		html: message,
	}

	try {
		const res = await transport.sendMail(mailOptions)
		return res
	} catch (error) {
		throw new Error(error as string)
	}
}

export default sendEmail
