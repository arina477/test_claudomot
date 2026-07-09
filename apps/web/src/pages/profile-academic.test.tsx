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

  it('renders the FullPageScroll wrapper as root (overflow-y-auto h-dvh, no containing-block props)', async () => {
    // wave-81 F7 — ProfilePage was the founder-reported clipped page; its
    // interactive save button lives below the fold, so the scroll wrapper is the
    // load-bearing fix. Assert the wrapper is the ROOT and adds no containing block.
    mockApi.getProfile.mockResolvedValue(makeProfile());
    const { container } = renderPage();
    // Wait for the loaded (non-skeleton) render — the Institution field only
    // exists once the profile has loaded.
    await screen.findByLabelText('Institution');

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('overflow-y-auto');
    expect(root.className).toContain('h-dvh');
    const style = root.getAttribute('style') ?? '';
    for (const forbidden of ['transform', 'filter', 'contain', 'will-change']) {
      expect(root.className).not.toContain(forbidden);
      expect(style).not.toContain(forbidden);
    }
  });

  it('a failed over-length save scrolls+focuses the invalid field and marks it aria-invalid', async () => {
    // wave-89 a11y — a failed academic save must not silently early-return; it
    // must take the user to the first invalid field. Bio over-length here.
    const scrollSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {});
    mockApi.getProfile.mockResolvedValue(makeProfile());
    renderPage();

    const bio = (await screen.findByLabelText('Bio')) as HTMLTextAreaElement;
    // fireEvent.change bypasses the maxLength attribute in jsdom, so we can push
    // the field state past the client bound and trigger the guard.
    const overLong = 'x'.repeat(501); // ACADEMIC_MAX.bio = 500
    await act(async () => {
      fireEvent.change(bio, { target: { value: overLong } });
    });

    // The save button is disabled while a client error is present, so submit the
    // form directly (this is the path the guard protects).
    const form = bio.closest('form') as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    // The invalid field is focused, marked aria-invalid, and was scrolled to.
    expect(bio).toHaveFocus();
    expect(bio).toHaveAttribute('aria-invalid', 'true');
    expect(scrollSpy).toHaveBeenCalled();
    // The over-length message is still rendered (role="alert").
    expect(screen.getByRole('alert')).toHaveTextContent(/bio must be 500 characters or fewer/i);
    // No PATCH was attempted on the error path.
    expect(mockApi.patchProfile).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
  });

  it('with multiple over-length fields, focuses the FIRST in priority order (pronouns before bio)', async () => {
    const scrollSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {});
    mockApi.getProfile.mockResolvedValue(makeProfile());
    renderPage();

    const pronouns = (await screen.findByLabelText('Pronouns')) as HTMLInputElement;
    const bio = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(pronouns, { target: { value: 'p'.repeat(41) } }); // max 40
      fireEvent.change(bio, { target: { value: 'b'.repeat(501) } }); // max 500
    });

    const form = pronouns.closest('form') as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    // Pronouns wins the priority order — it is focused and aria-invalid, not bio.
    expect(pronouns).toHaveFocus();
    expect(pronouns).toHaveAttribute('aria-invalid', 'true');
    expect(bio).toHaveAttribute('aria-invalid', 'false');
    expect(scrollSpy).toHaveBeenCalled();
    expect(mockApi.patchProfile).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
  });

  it('a valid academic save proceeds with no focus interference and no scrollIntoView', async () => {
    const scrollSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {});
    mockApi.getProfile.mockResolvedValue(makeProfile());
    mockApi.patchProfile.mockImplementation(async (data: Record<string, unknown>) =>
      makeProfile({ ...(data as Partial<ProfileResponse>) }),
    );
    renderPage();

    const institution = (await screen.findByLabelText('Institution')) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(institution, { target: { value: 'UC Berkeley' } });
    });

    const saveBtn = screen.getByRole('button', { name: /save academic identity/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(mockApi.patchProfile).toHaveBeenCalledTimes(1);
    });
    // Happy path: save landed, shell refreshed, success shown — and the error
    // path's scrollIntoView was NOT triggered.
    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText('Academic identity saved.')).toBeInTheDocument();
    expect(scrollSpy).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
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
