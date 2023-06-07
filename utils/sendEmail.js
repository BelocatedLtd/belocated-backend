import nodemailer from "nodemailer"

const sendEMail = async (subject, message, send_to, reply_to)  => {
    try {
         //Define Email Transporter
         const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: 'belocatedltd@gmail.com',
                pass: 'ecacbnygqyrhozet',
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 5 * 60 * 1000, // 5 min
        })

        //Cretae Mail Options
    const data = {
        from: 'belocatedltd@gmail.com',
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