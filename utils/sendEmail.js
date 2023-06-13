import nodemailer from "nodemailer"

// const emailData = {
//     emailHost: process.env.EMAIL_HOST,
//     emailUser: process.env.EMAIL_USER,
//     emailPass: process.env.EMAIL
//   }

const sendEMail = async (subject, message, send_to, reply_to)  => {
    try {
         //Define Email Transporter
         const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            secure: false,
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 5 * 60 * 1000, // 5 min
        })

        //Cretae Mail Options
    const data = {
        from: process.env.EMAIL_USER,
        subject: subject,
        html: message,
        to: send_to,
        replyTo: reply_to,
    }

    // Send Email
    const info = await transporter.sendMail(data)
        return info
    } catch (error) {
        throw new Error(error)
    }
}


export default sendEMail