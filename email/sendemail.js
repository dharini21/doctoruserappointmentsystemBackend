const { createTransport } = require('nodemailer');
const transporter = createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: 'sridharini2103@gmail.com',
        pass: 'qyulhcyfgswgskyd',
    },
});

const sendWelcomeEmail = async (email, name, password) => {
    try {
        await transporter.sendMail({
            from: 'sridharini2103@gmail.com',
            to: email,
            subject: 'Welcome to Our Service!',
            text: `Hi ${name},\n\nYour account has been created successfully!\n\nYour password is: ${password}`,
        });
        console.log(' Accound created Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendDeleteEmail = async (email, name) => {
    try {
        await transporter.sendMail({
            from: 'sridharini2103@gmail.com',
            to: email,
            subject: 'Thankyou!',
            text: `Hi ${name},\n\nYour account has been deleted...!-_-`,
        });
        console.log('Delete Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const requestEmail = async (email, doctorName, patientName, day, date, time, reason) => {
    try {
        await transporter.sendMail({
            from: 'sridharini2103@gmail.com',
            to: email,
            subject: 'New Appointment Request',
            text: `Hi Dr. ${doctorName},\n\nYou have a new appointment request from ${patientName}.\n\nDetails:\nDay:${day}\nDate: ${date}\nTime: ${time}\nReason: ${reason}\n\nPlease log in to your account to accept or decline this appointment.\n\nThank you!`,
        });
        console.log('Doctor Request Email sent successfully');
    } catch (error) {
        console.error('Error sending doctor request email:', error);
    }
};

const cancelEmail = async (email, doctorName, patientName, day, date, time) => {
    try {
        await transporter.sendMail({
            from: 'sridharini2103@gmail.com',
            to: email,
            subject: ' Appointment canceled',
            text: `Hi ${doctorName},\n\nYour appointment canceled.By the patient ${patientName}.\n\nDetails:\nDay:${day}\nDate: ${date}\nTime: ${time}\nThank you!`,
        });
        console.log('cancel Email sent successfully');
    } catch (error) {
        console.error('Error sending doctor request email:', error);
    }
}

const updateEmail = async (email, doctorName, patientName, day, date, time, reason, status) => {
    try {
        await transporter.sendMail({
            from: 'sridharini2103@gmail.com',
            to: email,
            subject: ' Appointment updated',
            text: `Hi ${patientName},\n\nYour appointment ${status}.By the doctor Dr. ${doctorName}.\n\nDetails:\nDay:${day}\nDate: ${date}\nTime: ${time}\n Reason: ${reason}\nThank you!`,
        });
        console.log('status updated Email sent successfully');
    } catch (error) {
        console.error('Error sending doctor request email:', error);
    }
}
module.exports = { sendWelcomeEmail, sendDeleteEmail, requestEmail, cancelEmail, updateEmail };
