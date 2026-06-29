/**
 * App router — React Router v7 BrowserRouter with all routes.
 *
 * Route map:
 *   /               LandingPage (public)
 *   /signup         SignupPage  (guest only → redirect /app if session exists)
 *   /login          LoginPage   (guest only)
 *   /forgot-password ForgotPasswordPage (guest only)
 *   /reset-password  ResetPasswordPage (public — consumes ?token=)
 *   /verify-email    EmailVerifyPage (public — works with or without session)
 *   /app             AppHome    (auth-required)
 *   /settings/profile ProfilePage (auth-required)
 *   *               → /  (fallback)
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './auth/AuthGuard';
import { GuestGuard } from './auth/GuestGuard';
import { AppHome } from './pages/AppHome';
import { EmailVerifyPage } from './pages/EmailVerifyPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SignupPage } from './pages/SignupPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerifyPage />} />

        {/* Guest-only (redirect to /app when already authenticated) */}
        <Route
          path="/signup"
          element={
            <GuestGuard>
              <SignupPage />
            </GuestGuard>
          }
        />
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestGuard>
              <ForgotPasswordPage />
            </GuestGuard>
          }
        />

        {/* Auth-required */}
        <Route
          path="/app"
          element={
            <AuthGuard>
              <AppHome />
            </AuthGuard>
          }
        />
        <Route
          path="/settings/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
