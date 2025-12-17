import { Verification_Email_Template, Welcome_Email_Template } from "./EmailTemplate.js";
import { resend, transporter } from "./Email.config.js";
//  console.log(transporter);
 
export const sendVerificationEmail=async(email,verificationCode)=>{
    try {
     const response=   await resend.emails.send({
            from: process.env.EMAIL,
            to: [email], 
            subject: "Verify your Email", 
            html: Verification_Email_Template.replace("{verificationCode}",verificationCode)
        })
        console.log('Email send Successfully',response)
    } catch (error) {
        console.log('Email error',error)
    }
}

// WELCOME EMAIL
export const welcomeEmail = async (name,email) => {
  const info =await resend.emails.send({
    from: 'verification@ai-mall.in',
    to: [email],
    subject: `Welcome ${name}`,
    html: Welcome_Email_Template.replace("{name}",name), 
  });

  console.log("Message sent:", info);
};

