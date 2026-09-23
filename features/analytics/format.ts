/**
 * Formatters for metric values.
 *
 * All of them take `number | null` and render an em dash for null. That is
 * the point: the backend deliberately sends null when a denominator is empty,
 * and printing "0%" there would claim the AI resolved nothing when the truth
 * is that nothing has closed yet.
 */

export const EMPTY = '—';

export function formatPercent(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  return new Intl.NumberFormat('th-TH').format(value);
}

export function formatDecimal(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  return value.toFixed(digits);
}

/** Durations read in whichever unit keeps the number small and legible. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return EMPTY;
  if (seconds < 1) return `${Math.round(seconds * 1000)} มิลลิวินาที`;
  if (seconds < 60) return `${seconds.toFixed(1)} วินาที`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} นาที`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชม.`;
}

export function formatMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return EMPTY;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Cost in USD.
 *
 * Small figures keep four decimals — per-conversation spend is fractions of a
 * cent, and rounding to $0.00 would suggest the AI is free.
 */
export function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  if (value === 0) return '$0.00';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function formatTokens(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EMPTY;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** Human labels for the backend handoff_reason enum. */
export const HANDOFF_REASON_LABEL: Record<string, string> = {
  CUSTOMER_REQUESTED: 'ลูกค้าขอคุยกับคน',
  AI_CANNOT_ANSWER: 'AI ตอบไม่ได้',
  NO_KNOWLEDGE_FOUND: 'ไม่พบข้อมูลใน Knowledge Base',
  TOOL_ERROR: 'เครื่องมือทำงานผิดพลาด',
  PROVIDER_ERROR: 'ผู้ให้บริการ AI ขัดข้อง',
  SENSITIVE_TOPIC: 'หัวข้อละเอียดอ่อน',
  BUSINESS_RULE: 'กฎทางธุรกิจ',
  MANUAL_TAKEOVER: 'เจ้าหน้าที่เข้ารับเอง',
};
