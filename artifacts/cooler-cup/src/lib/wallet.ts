const KEY = 'cooler_cup_address';

export function getAddress(): string | null {
  return localStorage.getItem(KEY);
}

export function setAddress(address: string): void {
  localStorage.setItem(KEY, address);
}

export function clearAddress(): void {
  localStorage.removeItem(KEY);
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
