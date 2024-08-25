import nodemailer from 'nodemailer'
// import Mailgun from 'mailgun.js';
import dotenv from 'dotenv'

dotenv.config()

//import mg from 'nodemailer-mailgun-transport'

// const API_KEY = process.env.MAILGUN_API_KEY;
// const DOMAIN = 'mail.belocated.ng';

const HOST = process.env.ZEPTO_HOST
const USER = process.env.ZEPTO_USER
const PASS = process.env.ZEPTO_PASS

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

const sendEMail = async (subject, message, send_to, reply_to) => {
	var mailOptions = {
		from: '"Belocated" <cs@belocated.ng>',
		to: send_to,
		subject: subject,
		html: message,
	}

	try {
		const res = await transport.sendMail(mailOptions)
		return res
	} catch (error) {
		throw new Error(error)
	}
}

export default sendEMail
