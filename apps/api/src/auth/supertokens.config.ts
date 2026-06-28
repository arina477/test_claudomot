import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Session from 'supertokens-node/recipe/session';
import type { EmailService } from '../email/email.service';
import type { UsersService } from '../users/users.service';

export function initSuperTokens(usersService: UsersService, emailService: EmailService): void {
  supertokens.init({
    framework: 'express',
    appInfo: {
      appName: 'StudyHall',
      apiDomain: process.env.API_ORIGIN ?? 'http://localhost:3000',
      websiteDomain: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
      apiBasePath: '/auth',
    },
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI ?? 'http://localhost:3567',
      // exactOptionalPropertyTypes: omit apiKey entirely when undefined rather than passing undefined
      ...(process.env.SUPERTOKENS_API_KEY !== undefined
        ? { apiKey: process.env.SUPERTOKENS_API_KEY }
        : {}),
    },
    recipeList: [
      EmailPassword.init({
        override: {
          functions: (original) => ({
            ...original,
            signUp: async (input) => {
              const result = await original.signUp(input);
              if (result.status === 'OK') {
                // G-1: insert users row inside the signUp override.
                // If the DB insert fails, the thrown error propagates and
                // the request fails — no orphan auth user proceeds.
                await usersService.createUserIfNotExists({
                  id: result.user.id,
                  email: result.user.emails[0] ?? '',
                });
              }
              return result;
            },
          }),
        },
        emailDelivery: {
          override: (original) => ({
            ...original,
            sendEmail: async (input) => {
              // input.type === 'PASSWORD_RESET' — only one variant for EmailPassword
              await emailService.sendEmail({
                to: input.user.email,
                subject: 'Reset your StudyHall password',
                html: `<p>Reset your password: <a href="${input.passwordResetLink}">${input.passwordResetLink}</a></p>`,
              });
            },
          }),
        },
      }),
      EmailVerification.init({
        mode: 'REQUIRED',
        emailDelivery: {
          override: (original) => ({
            ...original,
            sendEmail: async (input) => {
              // input.type === 'EMAIL_VERIFICATION'
              await emailService.sendEmail({
                to: input.user.email,
                subject: 'Verify your StudyHall email',
                html: `<p>Verify your email address: <a href="${input.emailVerifyLink}">${input.emailVerifyLink}</a></p>`,
              });
            },
          }),
        },
      }),
      Session.init({
        cookieSameSite: 'lax',
        cookieSecure: process.env.NODE_ENV === 'production',
      }),
    ],
  });
}
