import mail from "../mail/mail";

export const sendVerificationEmail = async (
  to: string,
  name: string,
  verifyUrl: string
) => {
  try {
    const content = await mail.render("verify-email.ejs", { name, verifyUrl });
    const result = await mail.send({
      to,
      subject: "Email Verification",
      content,
    });
    return result;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
};
