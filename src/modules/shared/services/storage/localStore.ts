import logger from 'modules/shared/services/logger/logger';

/**
 * Acceso tipado y tolerante a fallos a localStorage.
 * Un localStorage lleno o bloqueado (modo privado) NO debe tumbar la app.
 */
class LocalStore {
  private isAvailable(): boolean {
    try {
      const probe = '__responde_ya_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  read<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch (error) {
      logger.warn('No se pudo leer de localStorage', { key, error: String(error) });
      return fallback;
    }
  }

  write<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('No se pudo escribir en localStorage', { key, error: String(error) });
      return false;
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return;
    window.localStorage.removeItem(key);
  }
}

/** Module-level singleton. */
const localStore = new LocalStore();

export default localStore;
