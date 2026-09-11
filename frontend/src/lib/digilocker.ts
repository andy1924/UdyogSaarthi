export interface DigiLockerSandboxResult {
  reference: string;
  verified: boolean;
}

export interface DigiLockerAdapter {
  connect(signal?: AbortSignal): Promise<DigiLockerSandboxResult>;
}

class SandboxDigiLockerAdapter implements DigiLockerAdapter {
  async connect(signal?: AbortSignal): Promise<DigiLockerSandboxResult> {
    const endpoint = import.meta.env.VITE_DIGILOCKER_SANDBOX_URL as string | undefined;
    if (endpoint) {
      const response = await fetch(endpoint, { method: 'POST', signal });
      if (!response.ok) throw new Error('DigiLocker Sandbox could not be reached.');
      const result = await response.json() as { reference?: unknown; verified?: unknown };
      if (typeof result.reference !== 'string' || !result.reference) throw new Error('DigiLocker Sandbox returned an invalid response.');
      return { reference: result.reference, verified: result.verified === true };
    }
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 800);
      signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
    return { reference: `sandbox-${crypto.randomUUID()}`, verified: false };
  }
}

export const digiLockerAdapter: DigiLockerAdapter = new SandboxDigiLockerAdapter();
