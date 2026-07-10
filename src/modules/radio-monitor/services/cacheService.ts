class CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();

  /**
   * Recupera un valor de la caché. Retorna null si no existe o ha expirado.
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key); // Limpieza de caché expirada
      return null;
    }

    return item.value as T;
  }

  /**
   * Almacena un valor en la caché con un tiempo de vida (TTL) específico en milisegundos.
   */
  set(key: string, value: any, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Invalida de forma manual una clave específica de la caché.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia toda la caché.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
