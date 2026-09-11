import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiService, AUTH_REQUIRED_EVENT } from './api';

describe('protected API session recovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('clears a rejected token and asks the app to show sign in', async () => {
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    const browserWindow = new EventTarget();
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })));

    const service = new ApiService();
    service.setToken('expired-token');
    const signInRequested = vi.fn();
    browserWindow.addEventListener(AUTH_REQUIRED_EVENT, signInRequested);

    await expect(service.getFeasibilityScore({
      location_text: 'Shirur, Pune, Maharashtra',
      business_category: 'food_processing',
      lat: 18.82,
      lon: 74.37,
    })).rejects.toMatchObject({ name: 'ApiError', status: 401 });

    expect(service.getToken()).toBeNull();
    expect(storage.has('udyog_access_token')).toBe(false);
    expect(signInRequested).toHaveBeenCalledOnce();
  });

  it('restores a valid session through the backend and logs out cleanly', async () => {
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('localStorage', localStorage);
    const sessionUser = { id: 'user-1', email: 'owner@example.com', role: 'applicant', is_active: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sessionUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const service = new ApiService();
    service.setToken('signed-session-token');

    await expect(service.getCurrentUser()).resolves.toEqual(sessionUser);
    expect(fetch).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer signed-session-token' },
    });

    service.logout();
    expect(service.getToken()).toBeNull();
    expect(storage.has('udyog_access_token')).toBe(false);
  });

  it('rejects an expired JWT before making a protected request', async () => {
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('fetch', vi.fn());
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }));
    const service = new ApiService();
    service.setToken(`header.${payload}.signature`);

    await expect(service.getCurrentUser()).rejects.toThrow('Sign in is required');
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.has('udyog_access_token')).toBe(false);
  });
});
