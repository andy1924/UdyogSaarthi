export type IdentityDocumentKind = 'pan' | 'aadhaar';

export interface IdentityDocumentState {
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'valid' | 'invalid';
  error?: string;
}

const DATABASE_NAME = 'udyogsaarthi-workflow';
const STORE_NAME = 'identity-documents';
export const MAX_IDENTITY_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IDENTITY_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function validateApplicantName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Applicant name is required.';
  if (name.length < 2) return 'Enter at least 2 characters.';
  if (name.length > 80) return 'Applicant name must be 80 characters or fewer.';
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) return 'Use letters, spaces, apostrophes, full stops, or hyphens only.';
  if (/\s{2,}|[-.'’]{2,}/u.test(name)) return 'Remove repeated spaces or punctuation.';
  return null;
}

export function validateIdentityFile(file: File): string | null {
  if (!ACCEPTED_IDENTITY_FILE_TYPES.includes(file.type)) return 'Upload a PDF, JPG, or PNG file.';
  if (file.size === 0) return 'This file is empty. Choose another file.';
  if (file.size > MAX_IDENTITY_FILE_SIZE) return 'File size must be 5 MB or less.';
  return null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeIdentityFile(kind: IdentityDocumentKind, file: File): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, kind);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadIdentityFile(kind: IdentityDocumentKind): Promise<File | null> {
  const database = await openDatabase();
  const file = await new Promise<File | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(kind);
    request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return file;
}

export async function removeIdentityFile(kind: IdentityDocumentKind): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(kind);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export function toDocumentState(file: File): IdentityDocumentState {
  return { fileName: file.name, fileSize: file.size, fileType: file.type, status: 'valid' };
}
