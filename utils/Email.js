import { Verification_Email_Template, Welcome_Email_Template, Reset_Password_Email_Template } from "./EmailTemplate.js";
import { resend, transporter } from "./Email.config.js";
import { marketPlace } from "../consts.js";
//  console.log(transporter);

export const sendVerificationEmail = async (email, name, verificationCode) => {
  try {
    const response = await resend.emails.send({
      from: `AI-MALL <${process.env.EMAIL}>`,
      to: [email],
      subject: "Verify Your Email",
      html: Verification_Email_Template.replace("{name}", name).replace("{verificationCode}", verificationCode)
    })
    console.log("resend_msg", response);

  } catch (error) {
    console.log('Email error', error)
  }
}

// WELCOME EMAIL
export const welcomeEmail = async (name, email) => {
  const info = await resend.emails.send({
    from: `AI-MALL <${process.env.EMAIL}>`,
    to: [email],
    subject: `Welcome ${name}`,
    html: Welcome_Email_Template.replace("{name}", name).replace("{dashboardUrl}", marketPlace),
  });

};

export const sendResetPasswordEmail = async (email, name, resetUrl) => {
  try {
    const response = await resend.emails.send({
      from: `AI-MALL <${process.env.EMAIL}>`,
      to: [email],
      subject: "Reset Your Password",
      html: Reset_Password_Email_Template.replace("{name}", name).replace("{resetUrl}", resetUrl)
    })
    console.log("resend_msg", response);
  } catch (error) {
    console.log('Email error', error)
  }
}

