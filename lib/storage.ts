// Storage abstraction for client-side persistence
// Uses localStorage initially; can be swapped for backend later

const STORAGE_VERSION = "1.0.0";
const VERSION_KEY = "finance_tracker_version";

export class Storage {
  private static isClient = typeof window !== "undefined";

  /**
   * Get an item from storage
   */
  static get<T>(key: string): T | null {
    if (!this.isClient) return null;

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   */
  static set<T>(key: string, value: T): boolean {
    if (!this.isClient) return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Remove an item from storage
   */
  static remove(key: string): boolean {
    if (!this.isClient) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static clear(): boolean {
    if (!this.isClient) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  }

  /**
   * Get all keys from storage
   */
  static keys(): string[] {
    if (!this.isClient) return [];

    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("Error getting storage keys:", error);
      return [];
    }
  }

  /**
   * Check storage version and handle migrations if needed
   */
  static checkVersion(): boolean {
    const currentVersion = this.get<string>(VERSION_KEY);

    if (!currentVersion) {
      this.set(VERSION_KEY, STORAGE_VERSION);
      return true;
    }

    if (currentVersion !== STORAGE_VERSION) {
      console.warn(
        `Storage version mismatch. Current: ${currentVersion}, Expected: ${STORAGE_VERSION}`
      );
      // Future: Add migration logic here
      return false;
    }

    return true;
  }

  /**
   * Export all data as JSON
   */
  static exportData(): string {
    if (!this.isClient) return "{}";

    const data: Record<string, unknown> = {};
    const keys = this.keys();

    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        data[key] = value;
      }
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  static importData(json: string): boolean {
    if (!this.isClient) return false;

    try {
      const data = JSON.parse(json) as Record<string, unknown>;

      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
      }

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }
}

// Storage keys
export const StorageKeys = {
  PAY_SCHEDULE: "pay_schedule",
  PAY_PERIODS: "pay_periods",
  ACCOUNTS: "accounts",
  BILLS: "bills",
  EXPENSES: "expenses",
  PLANNED_PAYMENTS: "planned_payments",
  SETTINGS: "settings",
} as const;
