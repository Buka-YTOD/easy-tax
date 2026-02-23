export function getStoredItem<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getStoredList<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setStoredList<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}
