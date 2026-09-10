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
});
