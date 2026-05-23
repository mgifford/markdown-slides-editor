import { COLOR_MODE_STORAGE_KEY } from "./color-mode.js";
import { CAPTION_LANGUAGE_STORAGE_KEY } from "./speech-recognition.js";
import {
  STORAGE_KEY,
  clearStoredDocuments,
  removeSource,
} from "./storage.js";

export const PRESENTER_SYNC_STORAGE_KEY = "markdown-slides-editor.presenter";
export const AUDIENCE_PRIMARY_STORAGE_KEY = "markdown-slides-editor.audience-primary";

export const APP_LOCAL_STORAGE_KEYS = [
  STORAGE_KEY,
  COLOR_MODE_STORAGE_KEY,
  CAPTION_LANGUAGE_STORAGE_KEY,
  PRESENTER_SYNC_STORAGE_KEY,
  AUDIENCE_PRIMARY_STORAGE_KEY,
];

export function clearKnownLocalStorage(storage = globalThis.localStorage) {
  if (!storage?.removeItem) return;
  APP_LOCAL_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

export async function clearCacheStorage(cacheStorage = globalThis.caches) {
  if (!cacheStorage?.keys || !cacheStorage?.delete) return;
  const keys = await cacheStorage.keys();
  await Promise.all(keys.map((key) => cacheStorage.delete(key)));
}

export async function unregisterServiceWorkers(
  serviceWorker = globalThis.navigator?.serviceWorker,
) {
  if (!serviceWorker?.getRegistrations) return;
  const registrations = await serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export async function clearDeckData() {
  await removeSource(STORAGE_KEY);
}

export async function clearAllLocalData(options = {}) {
  const {
    storage = globalThis.localStorage,
    cacheStorage = globalThis.caches,
    serviceWorker = globalThis.navigator?.serviceWorker,
  } = options;

  await clearStoredDocuments();
  clearKnownLocalStorage(storage);
  await clearCacheStorage(cacheStorage);
  await unregisterServiceWorkers(serviceWorker);
}
