import nodemailer from "nodemailer";
import { Resend } from "resend";

const EMAIL = process.env.EMAIL;
const PASS = process.env.EMAIL_PASS_KEY;

export const transporter = (EMAIL && PASS) ? nodemailer.createTransport({
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
}) : null;

if (!EMAIL || !PASS) {
  console.warn("⚠️ Email credentials missing. Nodemailer disabled.");
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : { emails: { send: async () => console.log("⚠️ Resend API Key missing. Email mocking enabled.") } };

