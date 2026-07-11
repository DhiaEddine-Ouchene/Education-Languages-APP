import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function layout(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F9F9F7;border-radius:12px">
    <h2 style="color:#7F77DD;margin-bottom:16px">${title}</h2>
    <div style="color:#1A1A2E;font-size:15px;line-height:1.6">${body}</div>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Sent by ${process.env.NEXT_PUBLIC_APP_NAME ?? "EduPlay"}</p>
  </div>`;
}

export async function sendMail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error("[mail] failed to send", subject, err);
  }
}

// Authentication emails
export const sendVerificationCode = (to: string, name: string, code: string) => {
  const html = layout(
    "Verify your email address",
    `Hi <b>${name}</b>,<br/><br/>
    Thank you for signing up for <b>${process.env.NEXT_PUBLIC_APP_NAME ?? "EduPlay"}</b>!<br/><br/>
    Please use the following 6-digit verification code to complete your registration:
    <div style="background:#ECECFE;padding:20px;border-radius:10px;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;color:#7F77DD;margin:20px auto;max-width:240px;border:1px solid #7F77DD;">
      ${code}
    </div>
    This code is valid for <b>10 minutes</b>. If you did not request this code, please ignore this email.<br/><br/>
    Welcome aboard!`
  );

  // Fallback logs to print verification code in terminal (extremely useful for dev testing)
  console.log(`\n==========================================\n[MAIL FALLBACK] Verification Code for ${to}: ${code}\n==========================================\n`);

  return sendMail(to, "Verify your email address", html);
};

// Student emails
export const sendWelcomeStudent = (to: string, name: string) =>
  sendMail(to, "Welcome to your learning journey!", layout(`Welcome, ${name}!`, `You are all set. Play your first game today to start your streak and earn XP.`));

export const sendNewAssignment = (to: string, gameTitle: string, dueDate: Date) =>
  sendMail(to, "New assignment from your teacher", layout("New assignment", `Your teacher assigned <b>${gameTitle}</b>. Due date: <b>${dueDate.toDateString()}</b>.`));

export const sendStreakWarning = (to: string, streak: number) =>
  sendMail(to, "Your streak is about to break!", layout("Keep your streak alive 🔥", `Your ${streak}-day streak ends in 24 hours. Play one game to keep it going!`));

export const sendLevelUp = (to: string, level: number) =>
  sendMail(to, `You reached Level ${level}!`, layout("Level up! 🎉", `Congratulations, you are now <b>Level ${level}</b>. Keep learning!`));

export const sendBadgeEarned = (to: string, badgeName: string) =>
  sendMail(to, `Badge earned: ${badgeName}`, layout("New badge unlocked 🏅", `You earned the <b>${badgeName}</b> badge. Check your profile to see it.`));

// Educator emails
export const sendWelcomeEducator = (to: string, name: string) =>
  sendMail(to, "Welcome to EduPlay!", layout(`Welcome, ${name}!`, `Onboarding checklist:<ol><li>Create a vocabulary set</li><li>Build your first game</li><li>Create a class and invite students</li><li>Customize your brand</li></ol>`));

export const sendFirstStudentJoined = (to: string, className: string, studentName: string) =>
  sendMail(to, "Your first student joined!", layout("First student 🎓", `<b>${studentName}</b> joined your class <b>${className}</b>.`));

export const sendRenewalReminder = (to: string, plan: string, renewDate: Date) =>
  sendMail(to, "Subscription renewal reminder", layout("Renewal coming up", `Your <b>${plan}</b> plan renews on <b>${renewDate.toDateString()}</b>.`));

export const sendSaleNotification = (to: string, itemTitle: string, amount: number) =>
  sendMail(to, "You made a sale! 💰", layout("Marketplace sale", `<b>${itemTitle}</b> was purchased for <b>$${amount.toFixed(2)}</b>. You keep 75%.`));

export const sendEarningsSummary = (to: string, total: number, month: string) =>
  sendMail(to, `Your ${month} earnings summary`, layout("Monthly earnings", `You earned <b>$${total.toFixed(2)}</b> in ${month}. Great work!`));
