/**
 * Turkish locale formatting utilities
 * Handles currency, date, and number formatting according to Turkish standards
 */

/**
 * Format currency in Turkish Lira (TRY)
 * Format: ₺1.234,56 (dot for thousands, comma for decimals)
 * 
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ₺ symbol (default: true)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "₺1.234,56"
 * formatCurrency(1234.56, false) // "1.234,56"
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `₺${formatted}` : formatted;
}

/**
 * Format date in Turkish format (DD.MM.YYYY)
 * 
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date('2024-02-20')) // "20.02.2024"
 * formatDate('2024-02-20') // "20.02.2024"
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Format time in 24-hour format (HH:MM)
 * 
 * @param date - Date object, string, or timestamp
 * @returns Formatted time string
 * 
 * @example
 * formatTime(new Date('2024-02-20T14:30:00')) // "14:30"
 */
export function formatTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format date and time together
 * 
 * @param date - Date object, string, or timestamp
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime(new Date('2024-02-20T14:30:00')) // "20.02.2024 14:30"
 */
export function formatDateTime(date: Date | string | number): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format number with Turkish locale (dot for thousands, comma for decimals)
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234.56) // "1.234,56"
 * formatNumber(1234.567, 3) // "1.234,567"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage with Turkish locale
 * 
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(12.5) // "%12,5"
 * formatPercentage(12.567, 2) // "%12,57"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `%${formatNumber(value, decimals)}`;
}

/**
 * Parse Turkish formatted number string to number
 * Handles both dot and comma separators
 * 
 * @param value - Turkish formatted number string
 * @returns Parsed number
 * 
 * @example
 * parseNumber("1.234,56") // 1234.56
 * parseNumber("1234,56") // 1234.56
 */
export function parseNumber(value: string): number {
  // Remove thousand separators (dots) and replace decimal comma with dot
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized);
}

/**
 * Format date range in Turkish
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 * 
 * @example
 * formatDateRange(new Date('2024-02-01'), new Date('2024-02-29')) 
 * // "01.02.2024 - 29.02.2024"
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number
): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get Turkish month name
 * 
 * @param monthIndex - Month index (0-11)
 * @returns Turkish month name
 * 
 * @example
 * getTurkishMonthName(0) // "Ocak"
 * getTurkishMonthName(11) // "Aralık"
 */
export function getTurkishMonthName(monthIndex: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthIndex];
}

/**
 * Get Turkish day name
 * 
 * @param dayIndex - Day index (0-6, Sunday is 0)
 * @returns Turkish day name
 * 
 * @example
 * getTurkishDayName(0) // "Pazar"
 * getTurkishDayName(1) // "Pazartesi"
 */
export function getTurkishDayName(dayIndex: number): string {
  const days = [
    'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 
    'Perşembe', 'Cuma', 'Cumartesi'
  ];
  return days[dayIndex];
}

/**
 * Format relative time in Turkish (e.g., "2 saat önce", "3 gün önce")
 * 
 * @param date - Date to compare with now
 * @returns Relative time string in Turkish
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 saat önce"
 * formatRelativeTime(new Date(Date.now() - 86400000)) // "1 gün önce"
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dakika önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  if (diffWeek < 4) return `${diffWeek} hafta önce`;
  if (diffMonth < 12) return `${diffMonth} ay önce`;
  return `${diffYear} yıl önce`;
}
