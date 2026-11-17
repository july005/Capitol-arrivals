// Web-only adapter for browser previews; production iPhone builds use SQLite.
const Storage = {
  async getItem(key: string): Promise<string | null> {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
};

export default Storage;
