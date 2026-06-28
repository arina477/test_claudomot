import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY_AUTH;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY_AUTH is not set — email sending is disabled');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
    this.fromAddress = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  }

  async sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email not sent to ${input.to}: RESEND_API_KEY_AUTH not configured`);
      return;
    }

    const result = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (result.error !== null) {
      this.logger.error(`Failed to send email to ${input.to}: ${JSON.stringify(result.error)}`);
      // Do not throw — email failure must not roll back signup
    }
  }
}
