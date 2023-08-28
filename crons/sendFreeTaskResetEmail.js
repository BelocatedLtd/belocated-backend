import User from "../model/User.js"
import sendEMail from "../utils/sendEmail.js";


const subject = 'Gain Access To This Week\'s Paid Task On Belocated!';
const reply_to = "noreply@noreply.com";

const sendResetEmail = async() => {
    const users = await User.find();
    
        for (const user of users) {
            const message = `
            <p>Hello ${user.username}</p>
            <p>It's a new week and your free task clock has reset.</p>
            <p>Proceed to the <a href="https://belocated.ng">BeLocated platform</a> to complete your 2 free task and gain access to numerous paid tasks this week.</p>
            <p>Keep winning with BeLocated</p>
            <br/>
            <br/>

            <p>Regards,</p>
            <p>Belocated Team</p>
            `

            try {
                 // Send the email
                await sendEMail(subject, message, user.email, reply_to)

                // Delay for 1 minute
                await new Promise(resolve => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute
            } catch (error) {
                console.error(`Error sending email to ${user.email}:`, error);
            }
        }
}

export default sendResetEmail
        