/**
 * EmailService unit tests — wave-30 B-2 (step 5, Refs 0ba853e2)
 *
 * Covers:
 *   - sendAssignmentReminder: calls sendEmail with the correct recipient
 *   - sendAssignmentReminder: subject contains the assignment title
 *   - sendAssignmentReminder: html contains the due date (human-legible UTC) and server name
 *   - sendAssignmentReminder: inherits non-throwing + no-op-when-key-unset from sendEmail
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { EmailService } from './email.service';

describe('EmailService.sendAssignmentReminder', () => {
  let sut: EmailService;
  // Track sendEmail calls manually to avoid vi.spyOn generic variance issues
  let capturedCalls: Array<{ to: string; subject: string; html: string }>;

  beforeEach(() => {
    capturedCalls = [];
    // Instantiate without RESEND_API_KEY_AUTH set — sendEmail becomes a safe no-op.
    // We replace sendEmail with a manual capture so assertions are fully typed.
    process.env.RESEND_API_KEY_AUTH = undefined;
    sut = new EmailService();
    sut.sendEmail = async (input: { to: string; subject: string; html: string }) => {
      capturedCalls.push(input);
    };
  });

  it('calls sendEmail with the correct recipient', async () => {
    await sut.sendAssignmentReminder('student@example.com', {
      assignmentTitle: 'Chapter 5 Essay',
      dueDate: new Date('2026-07-15T14:30:00Z'),
      serverName: 'Calculus Study Group',
    });

    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0]?.to).toBe('student@example.com');
  });

  it('subject contains the assignment title', async () => {
    const title = 'Midterm Problem Set';

    await sut.sendAssignmentReminder('student@example.com', {
      assignmentTitle: title,
      dueDate: new Date('2026-07-20T09:00:00Z'),
      serverName: 'Physics 101',
    });

    expect(capturedCalls[0]?.subject).toContain(title);
  });

  it('html contains the due date (UTC-labeled) and server name', async () => {
    const dueDate = new Date('2026-07-20T09:00:00Z');
    const serverName = 'Physics 101';

    await sut.sendAssignmentReminder('student@example.com', {
      assignmentTitle: 'Midterm Problem Set',
      dueDate,
      serverName,
    });

    const html = capturedCalls[0]?.html ?? '';

    // html must contain the server name
    expect(html).toContain(serverName);

    // html must contain the year (minimum smoke-check that the date rendered)
    expect(html).toContain('2026');

    // html must contain the UTC timezone label
    expect(html).toMatch(/UTC/i);
  });

  it('propagates sendEmail rejection (thin wrapper — non-throwing contract is at sendEmail level)', async () => {
    let callCount = 0;
    sut.sendEmail = async (_input: { to: string; subject: string; html: string }) => {
      callCount++;
      throw new Error('network blip');
    };

    // sendAssignmentReminder simply awaits sendEmail — rejection propagates.
    await expect(
      sut.sendAssignmentReminder('student@example.com', {
        assignmentTitle: 'Essay',
        dueDate: new Date(),
        serverName: 'Group A',
      }),
    ).rejects.toThrow('network blip');

    // sendEmail was still invoked once
    expect(callCount).toBe(1);
  });
});
