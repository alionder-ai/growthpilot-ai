# Turkish Locale Utilities - Usage Guide

This document explains how to use the Turkish locale formatting utilities in GrowthPilot AI.

## Overview

All user-facing content in GrowthPilot AI must be displayed in Turkish with proper formatting:
- Currency: Turkish Lira (TRY) with format `₺1.234,56`
- Dates: `DD.MM.YYYY` format
- Numbers: Turkish locale (dot for thousands, comma for decimals)

## Import

```typescript
import { 
  formatCurrency, 
  formatDate, 
  formatNumber,
  formatPercentage 
} from '@/lib/utils/locale';

// Or import all
import * as locale from '@/lib/utils/locale';
```

## Currency Formatting

```typescript
import { formatCurrency } from '@/lib/utils/locale';

// With symbol (default)
formatCurrency(1234.56); // "₺1.234,56"

// Without symbol
formatCurrency(1234.56, false); // "1.234,56"

// Usage in components
<p>Toplam Harcama: {formatCurrency(totalSpend)}</p>
```

## Date Formatting

```typescript
import { formatDate, formatTime, formatDateTime } from '@/lib/utils/locale';

// Date only
formatDate(new Date('2024-02-20')); // "20.02.2024"
formatDate('2024-02-20'); // "20.02.2024"

// Time only (24-hour format)
formatTime(new Date('2024-02-20T14:30:00')); // "14:30"

// Date and time together
formatDateTime(new Date('2024-02-20T14:30:00')); // "20.02.2024 14:30"

// Date range
formatDateRange(startDate, endDate); // "01.02.2024 - 29.02.2024"

// Usage in components
<p>Oluşturulma Tarihi: {formatDate(createdAt)}</p>
```

## Number Formatting

```typescript
import { formatNumber, formatPercentage } from '@/lib/utils/locale';

// Numbers with decimals
formatNumber(1234.56); // "1.234,56"
formatNumber(1234.567, 3); // "1.234,567"

// Percentages
formatPercentage(12.5); // "%12,5"
formatPercentage(12.567, 2); // "%12,57"

// Usage in components
<p>ROAS: {formatNumber(roas, 2)}</p>
<p>Komisyon: {formatPercentage(commissionRate)}</p>
```

## Turkish Month and Day Names

```typescript
import { getTurkishMonthName, getTurkishDayName } from '@/lib/utils/locale';

const date = new Date('2024-02-20');
const monthName = getTurkishMonthName(date.getMonth()); // "Şubat"
const dayName = getTurkishDayName(date.getDay()); // "Salı"
```

## Relative Time

```typescript
import { formatRelativeTime } from '@/lib/utils/locale';

const oneHourAgo = new Date(Date.now() - 3600000);
formatRelativeTime(oneHourAgo); // "1 saat önce"

const yesterday = new Date(Date.now() - 86400000);
formatRelativeTime(yesterday); // "1 gün önce"

// Usage in components
<p>Son Güncelleme: {formatRelativeTime(updatedAt)}</p>
```

## Parsing Turkish Numbers

```typescript
import { parseNumber } from '@/lib/utils/locale';

// Parse Turkish formatted numbers back to JavaScript numbers
parseNumber("1.234,56"); // 1234.56
parseNumber("1234,56"); // 1234.56

// Useful for form inputs
const handleSubmit = (formData) => {
  const amount = parseNumber(formData.amount);
  // Use amount as a number
};
```

## Using Turkish Terms

```typescript
import { TURKISH_TERMS } from '@/lib/constants/turkish-terms';

// Use constants for consistent terminology
<h1>{TURKISH_TERMS.dashboard}</h1> // "Gösterge Paneli"
<button>{TURKISH_TERMS.save}</button> // "Kaydet"
<label>{TURKISH_TERMS.clientName}</label> // "Müşteri Adı"

// Validation messages
<span className="error">{TURKISH_TERMS.required}</span> // "Bu alan zorunludur"

// Industries
<option value="logistics">{TURKISH_TERMS.industries.logistics}</option> // "Lojistik"
```

## Best Practices

1. **Always use locale utilities** for displaying numbers, dates, and currency
2. **Use TURKISH_TERMS constants** instead of hardcoding Turkish text
3. **Format on display, not on storage** - store raw values in database
4. **Parse user input** when accepting Turkish formatted numbers
5. **Test with Turkish locale** to ensure proper formatting

## Examples in Components

### Financial Dashboard Card

```typescript
import { formatCurrency } from '@/lib/utils/locale';
import { TURKISH_TERMS } from '@/lib/constants/turkish-terms';

export function SpendCard({ amount }: { amount: number }) {
  return (
    <div className="card">
      <h3>{TURKISH_TERMS.totalSpend}</h3>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
    </div>
  );
}
```

### Campaign Metrics Table

```typescript
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils/locale';
import { TURKISH_TERMS } from '@/lib/constants/turkish-terms';

export function MetricsTable({ metrics }: { metrics: Metrics }) {
  return (
    <table>
      <thead>
        <tr>
          <th>{TURKISH_TERMS.spend}</th>
          <th>{TURKISH_TERMS.roas}</th>
          <th>{TURKISH_TERMS.ctr}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{formatCurrency(metrics.spend)}</td>
          <td>{formatNumber(metrics.roas, 2)}</td>
          <td>{formatPercentage(metrics.ctr, 2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
```

### Date Display

```typescript
import { formatDate, formatRelativeTime } from '@/lib/utils/locale';
import { TURKISH_TERMS } from '@/lib/constants/turkish-terms';

export function CampaignInfo({ campaign }: { campaign: Campaign }) {
  return (
    <div>
      <p>
        {TURKISH_TERMS.createdAt}: {formatDate(campaign.createdAt)}
      </p>
      <p>
        {TURKISH_TERMS.lastUpdated}: {formatRelativeTime(campaign.updatedAt)}
      </p>
    </div>
  );
}
```

## Common Mistakes to Avoid

❌ **Don't do this:**
```typescript
// Hardcoded English text
<button>Save</button>

// JavaScript number formatting
<p>₺{amount.toFixed(2)}</p>

// Wrong date format
<p>{new Date().toLocaleDateString()}</p>
```

✅ **Do this instead:**
```typescript
// Use Turkish terms
<button>{TURKISH_TERMS.save}</button>

// Use locale utilities
<p>{formatCurrency(amount)}</p>

// Use Turkish date format
<p>{formatDate(new Date())}</p>
```

## Testing

When writing tests, import and use the locale utilities to ensure consistent formatting:

```typescript
import { formatCurrency, formatDate } from '@/lib/utils/locale';

test('displays formatted currency', () => {
  const amount = 1234.56;
  expect(formatCurrency(amount)).toBe('₺1.234,56');
});

test('displays Turkish date format', () => {
  const date = new Date('2024-02-20');
  expect(formatDate(date)).toBe('20.02.2024');
});
```
