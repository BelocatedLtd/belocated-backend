import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const HOST = process.env.EMAIL_HOST;
const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;

var transport = nodemailer.createTransport({
  host: HOST,
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: USER,
    pass: PASS,
  },
});

const sendEmail = async (subject: any, message: any, send_to: any, reply_to:any, plainText:any,) => {

  var mailOptions = {
    from: '"Belocated" <cs@belocated.ng>',
    to: send_to,
    subject: subject,
    text: plainText,
    html: message,
    replyTo: reply_to, // Valid domain email address
  };

  try {
    const res = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', res);
    return res;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email. Please try again.');
	
  }
};

export default sendEmail;
