import nodemailer from 'nodemailer'

function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:5173'
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendActivationEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const url = `${getAppUrl()}/activate?token=${token}`

  if (!process.env.SMTP_HOST) {
    console.log(`[Email] Activation link for ${username}: ${url}`)
    return
  }

  const transport = createTransport()
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@isuperhero.online',
    to,
    subject: 'Activate your iSuperhero account',
    html: `<p>Hi ${username},</p><p>Click <a href="${url}">here</a> to activate your account.</p>`,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const url = `${getAppUrl()}/reset-password?token=${token}`

  if (!process.env.SMTP_HOST) {
    console.log(`[Email] Password reset link for ${username}: ${url}`)
    return
  }

  const transport = createTransport()
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@isuperhero.online',
    to,
    subject: 'Reset your iSuperhero password',
    html: `<p>Hi ${username},</p><p>Click <a href="${url}">here</a> to reset your password.</p>`,
  })
}
