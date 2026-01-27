const nodemailer = require('nodemailer');

// Updated to use Mailtrap for development email testing
module.exports = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER || "your_mailtrap_user",
        pass: process.env.MAILTRAP_PASS || "your_mailtrap_pass"
    }
});
