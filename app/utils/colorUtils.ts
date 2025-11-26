const HEX_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export function isValidHexColor(value?: string | null): boolean {
  if (!value) return false;
  return HEX_REGEX.test(value.trim());
}

export function normalizeHex(value: string | undefined, fallback = '#000000'): string {
  const input = value?.trim() ?? '';
  if (!HEX_REGEX.test(input)) {
    return fallback.startsWith('#') ? fallback.toLowerCase() : `#${fallback.toLowerCase()}`;
  }

  let sanitized = input.startsWith('#') ? input.slice(1) : input;
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return `#${sanitized.toLowerCase()}`;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = normalizeHex(hex);
  const bigint = Number.parseInt(normalized.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const mapped = channel / 255;
    return mapped <= 0.03928 ? mapped / 12.92 : Math.pow((mapped + 0.055) / 1.055, 2.4);
  });

  return clamp(0.2126 * r + 0.7152 * g + 0.0722 * b);
};

export function getContrastRatio(foreground: string, background: string): number {
  const lumForeground = luminance(foreground);
  const lumBackground = luminance(background);
  const brighter = Math.max(lumForeground, lumBackground) + 0.05;
  const darker = Math.min(lumForeground, lumBackground) + 0.05;
  return Math.round((brighter / darker) * 100) / 100;
}

export function getReadableTextColor(backgroundHex: string): string {
  const [r, g, b] = hexToRgb(backgroundHex);
  // perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#111111' : '#ffffff';
}

