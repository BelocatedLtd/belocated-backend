import nodemailer from "nodemailer"

const sendEMail = async (subject, text, message, send_to, sent_from, reply_to)  => {
    //Define Email Transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        from: process.env.EMAIL_USER,
        tls: {
            rejectUnauthorized: false
        }
    })

    // Cretae Mail Options
    const options = {
        from: sent_from,
        to: send_to,
        replyTo: reply_to,
        subject: subject,
        text: text,
        html: message
    }

    //Send Email
    transporter.sendMail(options, function(err, info) {
        if (err) {
            console.log(err)
        } else {
        console.log(info)
        }
    })
}

export default sendEMail