/**
 * Returns YYYY-MM-DD in the user's LOCAL calendar date.
 * Immune to UTC / ISOString day-shifting issues.
 */
export function getLocalDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns HH:mm in the user's LOCAL time.
 */
export function getLocalTimeStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Steps a YYYY-MM-DD date string by offsetDays (e.g. -1 for yesterday, +1 for tomorrow).
 * Uses local calendar arithmetic to guarantee no timezone jumping.
 */
export function stepDateStr(dateStr, offsetDays) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return getLocalDateStr();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return getLocalDateStr();
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d + offsetDays);
  return getLocalDateStr(target);
}

/**
 * Friendly label for date display
 */
export function formatFriendlyDate(dateStr) {
  const today = getLocalDateStr();
  const yesterday = stepDateStr(today, -1);
  const tomorrow = stepDateStr(today, 1);

  if (dateStr === today) return '今日';
  if (dateStr === yesterday) return '昨日';
  if (dateStr === tomorrow) return '明日';
  return dateStr;
}
