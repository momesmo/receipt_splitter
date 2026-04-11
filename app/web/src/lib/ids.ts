export function generatePersonId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`;
}

export function generateItemId(): string {
  return generatePersonId();
}
