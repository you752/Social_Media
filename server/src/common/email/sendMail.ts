import nodemailer from "nodemailer";
import { env } from "../../config/env.service";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.googleAccount,
    pass: env.passwordAccount,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) => { 
  const info = await transporter.sendMail({
    from: `"Social Media App" <${env.googleAccount}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

