/**
 * wave-77 M13 leg-2 — ProfilePage academic-identity editor tests.
 *
 * Covers:
 *   1. Existing academic fields load into the form from GET /profile.
 *   2. Editing + Save round-trips PATCH /profile with the academic fields,
 *      refreshes the shell (ProfileContext.refresh), and reflects the values.
 *   3. academicRole select is populated from ACADEMIC_ROLES.
 */

import type { ProfileResponse } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/api', () => ({
  api: {
    getProfile: vi.fn(),
    patchProfile: vi.fn(),
  },
}));

import { api } from '../auth/api';
import { ProfileContext } from '../shell/ProfileContext';
import { ProfilePage } from './ProfilePage';

type MockApi = {
  getProfile: ReturnType<typeof vi.fn>;
  patchProfile: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

function makeProfile(overrides: Partial<ProfileResponse> = {}): ProfileResponse {
  return {
    userId: 'u-1',
    displayName: 'Julian Vance',
    username: 'julian',
    avatarUrl: null,
    accentColor: '#10b981',
    pronouns: 'he/him',
    bio: 'Studying data.',
    institution: 'MIT',
    program: 'Ph.D. CS',
    academicRole: 'student',
    academicYear: 'Year 3',
    ...overrides,
  };
}

const refresh = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfileContext.Provider value={{ profile: null, refresh }}>
        <ProfilePage />
      </ProfileContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProfilePage — academic identity editor', () => {
  it('loads existing academic fields into the form', async () => {
    mockApi.getProfile.mockResolvedValue(makeProfile());
    renderPage();
    const institution = (await screen.findByLabelText('Institution')) as HTMLInputElement;
    expect(institution.value).toBe('MIT');
    expect((screen.getByLabelText('Pronouns') as HTMLInputElement).value).toBe('he/him');
    expect((screen.getByLabelText('Academic role') as HTMLSelectElement).value).toBe('student');
    expect((screen.getByLabelText('Academic year') as HTMLInputElement).value).toBe('Year 3');
  });

  it('academic role select is populated from ACADEMIC_ROLES', async () => {
    mockApi.getProfile.mockResolvedValue(makeProfile());
    renderPage();
    const select = (await screen.findByLabelText('Academic role')) as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(expect.arrayContaining(['', 'student', 'educator', 'staff']));
  });

  it('Save round-trips PATCH /profile with academic fields and refreshes the shell', async () => {
    mockApi.getProfile.mockResolvedValue(makeProfile());
    mockApi.patchProfile.mockImplementation(async (data: Record<string, unknown>) =>
      makeProfile({ ...(data as Partial<ProfileResponse>) }),
    );
    renderPage();

    const institution = (await screen.findByLabelText('Institution')) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(institution, { target: { value: 'UC Berkeley' } });
    });

    const role = screen.getByLabelText('Academic role') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(role, { target: { value: 'educator' } });
    });

    const saveBtn = screen.getByRole('button', { name: /save academic identity/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(mockApi.patchProfile).toHaveBeenCalledTimes(1);
    });
    const payload = mockApi.patchProfile.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      institution: 'UC Berkeley',
      academicRole: 'educator',
      pronouns: 'he/him',
      program: 'Ph.D. CS',
      academicYear: 'Year 3',
    });
    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText('Academic identity saved.')).toBeInTheDocument();
  });

  it('selecting the empty role option + Save clears the role via PATCH academicRole:null', async () => {
    // Loads with a real role, then the user picks "Not specified" and saves.
    mockApi.getProfile.mockResolvedValue(makeProfile({ academicRole: 'student' }));
    mockApi.patchProfile.mockImplementation(async (data: Record<string, unknown>) =>
      // Server coerces '' → null and persists null (B-2). Reflect that.
      makeProfile({ ...(data as Partial<ProfileResponse>), academicRole: null }),
    );
    renderPage();

    const role = (await screen.findByLabelText('Academic role')) as HTMLSelectElement;
    expect(role.value).toBe('student');
    await act(async () => {
      fireEvent.change(role, { target: { value: '' } });
    });

    const saveBtn = screen.getByRole('button', { name: /save academic identity/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(mockApi.patchProfile).toHaveBeenCalledTimes(1);
    });
    const payload = mockApi.patchProfile.mock.calls[0]?.[0];
    // The clear must be an explicit null (contract also accepts '') — NOT omitted.
    expect(payload).toHaveProperty('academicRole', null);

    // UI reflects the cleared role after the save round-trips.
    await waitFor(() => {
      expect((screen.getByLabelText('Academic role') as HTMLSelectElement).value).toBe('');
    });
    expect(await screen.findByText('Academic identity saved.')).toBeInTheDocument();
  });
});
