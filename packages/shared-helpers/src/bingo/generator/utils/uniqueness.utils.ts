import type { GeneratedCell } from '../generator.interface';

/**
 * Generate a hash from cell values for uniqueness checking
 * The hash is based on cell values in their original order (not sorted),
 * making it position-aware for comparing identical card layouts.
 * @param cells Array of cells to hash
 * @returns Hash string
 */
export function generateCardHash(cells: GeneratedCell[]): string {
  // Create a string representation of cell values
  const values = cells.map(cell => {
    if (cell.type === 'free') return 'F';
    if (cell.type === 'blank') return 'B';
    return String(cell.value);
  });

  // Simple hash: join values with separator
  // This is sufficient for uniqueness checking within a session
  return values.join('-');
}

/**
 * Session card registry for tracking generated cards
 */
export class CardRegistry {
  private sessions: Map<string, Set<string>> = new Map();

  /**
   * Register a card hash for a session
   * @param sessionId Session identifier
   * @param hash Card hash
   * @returns True if the card was new (registered), false if duplicate
   */
  register(sessionId: string, hash: string): boolean {
    let sessionHashes = this.sessions.get(sessionId);

    if (!sessionHashes) {
      sessionHashes = new Set();
      this.sessions.set(sessionId, sessionHashes);
    }

    if (sessionHashes.has(hash)) {
      return false;
    }

    sessionHashes.add(hash);
    return true;
  }

  /**
   * Check if a hash exists in a session
   * @param sessionId Session identifier
   * @param hash Card hash
   * @returns True if hash exists (duplicate), false if unique
   */
  exists(sessionId: string, hash: string): boolean {
    const sessionHashes = this.sessions.get(sessionId);
    return sessionHashes?.has(hash) ?? false;
  }

  /**
   * Clear all cards for a session
   * @param sessionId Session identifier
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get count of cards in a session
   * @param sessionId Session identifier
   * @returns Number of cards registered
   */
  getSessionCount(sessionId: string): number {
    return this.sessions.get(sessionId)?.size ?? 0;
  }
}
