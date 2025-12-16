import nodemailer from "nodemailer";

const EMAIL = process.env.EMAIL;
const PASS = process.env.EMAIL_PASS_KEY;

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL,
    pass: PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
