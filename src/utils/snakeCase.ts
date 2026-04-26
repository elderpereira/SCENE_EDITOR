export function toSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function toUniqueSnakeCase(base: string, usedKeys: string[]): string {
  const sanitized = toSnakeCase(base) || 'sprite';
  if (!usedKeys.includes(sanitized)) {
    return sanitized;
  }

  let idx = 2;
  while (usedKeys.includes(`${sanitized}_${idx}`)) {
    idx += 1;
  }

  return `${sanitized}_${idx}`;
}