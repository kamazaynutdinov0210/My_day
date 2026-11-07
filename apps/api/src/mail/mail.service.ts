import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(email: string, resetUrl: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.EMAIL_FROM ?? 'noreply@myday.local';

    if (!host) {
      // Development fallback: never log the tokenized URL.
      this.logger.log(`[MAIL DEV] Password reset email queued for ${email} (SMTP not configured; link not logged)`);
      return;
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your My Day password',
      text: `You requested a password reset. Open this link to set a new password: ${resetUrl}\n\nThis link expires in 1 hour and can be used only once.`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Set a new password</a></p><p>This link expires in 1 hour and can be used only once.</p>`,
    });
  }
}