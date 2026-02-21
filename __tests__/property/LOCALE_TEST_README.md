# Locale Property-Based Tests

This test suite validates Turkish locale formatting and language switching functionality for GrowthPilot AI.

## Properties Tested

### Property 44: Turkish Locale Formatting
**Validates Requirements: 19.1, 19.2, 19.3, 19.4**

Tests that all locale-specific formatting follows Turkish standards:

#### Currency Formatting (Requirement 19.2)
- Format: `₺1.234,56` (₺ symbol, dot for thousands, comma for decimals)
- Always 2 decimal places
- Proper thousand separators for large amounts
- Symbol can be optionally hidden

**Test Coverage:**
- Random currency values (0 to 1,000,000)
- Specific edge cases (0.99, 1000000, etc.)
- Symbol presence/absence
- Decimal place consistency

#### Date Formatting (Requirement 19.3)
- Format: `DD.MM.YYYY` (e.g., "20.02.2024")
- Time format: `HH:MM` (24-hour)
- DateTime format: `DD.MM.YYYY HH:MM`
- Date ranges: `DD.MM.YYYY - DD.MM.YYYY`

**Test Coverage:**
- Random dates between 2000-2030
- Specific dates (edge of months, years)
- Time formatting validation
- Date range formatting

#### Number Formatting (Requirement 19.4)
- Format: `1.234,56` (dot for thousands, comma for decimals)
- Configurable decimal places
- Percentage format: `%12,5`
- Round-trip consistency (format → parse → format)

**Test Coverage:**
- Random numbers with various decimal places
- Parsing Turkish formatted strings
- Percentage formatting
- Round-trip conversion tests

#### Turkish Terms (Requirement 19.1)
- All UI text constants in Turkish
- Consistent terminology across application
- Industry-specific translations
- Time period terms

**Test Coverage:**
- Navigation terms (Dashboard, Clients, Campaigns, etc.)
- Financial terms (Budget, Commission, Revenue, etc.)
- Metrics (ROAS, CTR, CPC, etc.)
- Actions (Save, Cancel, Delete, etc.)
- Validation messages
- Industry translations
- Time period terms

### Property 45: Language Switching
**Validates Requirement: 19.5**

Tests that when i18n is implemented, language switching works correctly:

#### Language Support
- Turkish (tr) as default language
- English (en) as secondary language
- Valid language codes
- Translation mappings for both languages

**Test Coverage:**
- Language code validation
- Translation completeness (all keys present in both languages)
- Matching keys across languages
- Default language verification

#### Locale Independence
**Critical Property:** Locale formatting (currency, dates, numbers) MUST remain Turkish regardless of UI language.

Even when UI is in English:
- Currency: `₺1.234,56` (not $1,234.56)
- Dates: `20.02.2024` (not 02/20/2024)
- Numbers: `1.234,56` (not 1,234.56)
- Month names: Turkish (Ocak, Şubat, etc.)
- Day names: Turkish (Pazar, Pazartesi, etc.)
- Relative time: Turkish (5 dakika önce, etc.)

**Test Coverage:**
- Currency formatting after language switch
- Date formatting after language switch
- Number formatting after language switch
- Turkish month and day names
- Turkish relative time formatting

#### Translation Consistency
- Consistent terminology across languages
- No empty translations
- Key business terms properly translated
- Translation completeness validation

**Test Coverage:**
- Key term translations (dashboard, clients, campaigns)
- Empty translation detection
- Translation object structure validation

## Running the Tests

```bash
# Run all locale tests
npm test -- __tests__/property/locale.test.ts

# Run with coverage
npm test -- __tests__/property/locale.test.ts --coverage

# Run in watch mode
npm test -- __tests__/property/locale.test.ts --watch
```

## Test Configuration

- **Framework:** Jest with fast-check for property-based testing
- **Iterations:** 100 runs per property test
- **Test Environment:** Node.js
- **Timeout:** 30 seconds

## Implementation Files

### Core Utilities
- `lib/utils/locale.ts` - Turkish locale formatting functions
- `lib/constants/turkish-terms.ts` - Turkish UI text constants
- `lib/contexts/LanguageContext.tsx` - Language switching context (i18n)

### Verification Utilities
- `lib/utils/locale-verification.ts` - Manual verification helpers

## Key Test Patterns

### Property-Based Tests
```typescript
fc.assert(
  fc.property(
    fc.float({ min: 0, max: 1000000, noNaN: true }),
    (amount) => {
      const formatted = formatCurrency(amount);
      expect(formatted).toMatch(/^₺/);
      expect(formatted).toMatch(/,\d{2}$/);
    }
  ),
  { numRuns: 100 }
);
```

### Specific Example Tests
```typescript
const testCases = [
  { input: 1234.56, expected: '₺1.234,56' },
  { input: 1000000, expected: '₺1.000.000,00' },
];

testCases.forEach(({ input, expected }) => {
  expect(formatCurrency(input)).toBe(expected);
});
```

### Round-Trip Tests
```typescript
const formatted = formatNumber(num, 2);
const parsed = parseNumber(formatted);
const reformatted = formatNumber(parsed, 2);
expect(reformatted).toBe(formatted);
```

## Expected Test Results

All tests should pass with:
- ✓ Property 44: Turkish Locale Formatting (all sub-tests)
- ✓ Property 45: Language Switching (all sub-tests)
- ✓ Locale Integration Tests

## Common Issues and Solutions

### Issue: Currency format incorrect
**Solution:** Ensure `Intl.NumberFormat` uses 'tr-TR' locale

### Issue: Date format not DD.MM.YYYY
**Solution:** Use manual formatting with padStart, not Intl.DateTimeFormat

### Issue: Language switching breaks locale
**Solution:** Locale formatting should be independent of UI language

### Issue: Missing translations
**Solution:** Ensure all keys exist in both TR and EN translation objects

## Maintenance Notes

When adding new UI text:
1. Add to `TURKISH_TERMS` constant
2. Add to language translation files (TR and EN)
3. Update tests to verify new terms
4. Ensure consistent terminology

When modifying locale formatting:
1. Update formatting functions in `lib/utils/locale.ts`
2. Update tests to match new format
3. Run verification tests
4. Check all components using the formatter

## Related Requirements

- **Requirement 19.1:** All UI text in Turkish
- **Requirement 19.2:** Currency formatting (TRY)
- **Requirement 19.3:** Date formatting (DD.MM.YYYY)
- **Requirement 19.4:** Number formatting (Turkish locale)
- **Requirement 19.5:** Language switching (TR/EN) - Optional feature

## Test Statistics

- **Total Test Cases:** 30+
- **Property-Based Tests:** 10+
- **Example-Based Tests:** 20+
- **Integration Tests:** 2
- **Coverage Target:** 100% of locale utilities
