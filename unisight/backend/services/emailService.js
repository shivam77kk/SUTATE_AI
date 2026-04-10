export async function sendWelcomeEmail({ name, email, password, role }) {
  console.log(`[EmailService Stub] Sent welcome email to ${email}`);
}

export async function sendStudentAlert({ student, insight, faculty }) {
  console.log(`[EmailService Stub] Sent alert email to ${student.email}`);
}

export default { sendWelcomeEmail, sendStudentAlert };
