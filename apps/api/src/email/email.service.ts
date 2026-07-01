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

  async sendAssignmentReminder(
    to: string,
    opts: { assignmentTitle: string; dueDate: Date; serverName: string },
  ): Promise<void> {
    const { assignmentTitle, dueDate, serverName } = opts;

    // Human-legible UTC date string (e.g. "July 15, 2026 at 14:30 UTC")
    const dueDateStr = dueDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const subject = `Reminder: "${assignmentTitle}" is due soon`;

    // Transactional email — inline styles only, email-client-safe.
    // Brand: amber accent (#f59e0b — assignments/due-soon per design system),
    //        light background for maximum client compatibility.
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <!-- Header accent bar -->
          <tr>
            <td style="background-color:#f59e0b;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#a16207;text-transform:uppercase;letter-spacing:0.05em;">StudyHall</p>
              <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;line-height:1.3;">Assignment Reminder</h1>

              <p style="margin:0 0 8px;font-size:14px;color:#52525b;">You have an upcoming assignment in <strong style="color:#18181b;">${serverName}</strong>:</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#18181b;">${assignmentTitle}</p>
                    <p style="margin:0;font-size:13px;color:#a16207;">
                      <span style="display:inline-block;width:8px;height:8px;background-color:#f59e0b;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
                      Due: <strong>${dueDateStr}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#71717a;">Mark it as done in StudyHall once you&rsquo;ve completed it. This is a one-time reminder for this assignment.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f4f4f5;background-color:#fafafa;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">Sent by StudyHall &mdash; your academic community platform.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await this.sendEmail({ to, subject, html });
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
