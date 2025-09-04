// utils/mailer.js
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        if (!to) throw new Error("❌ No recipient defined!");

        const mailOptions = {
            from: `"Restaurant Orders" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
    } catch (err) {
        console.error("❌ Error sending email:", err);
    }
};

module.exports = sendEmail;
