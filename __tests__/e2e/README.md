# End-to-End Tests

Bu dizin, GrowthPilot AI platformunun kritik kullanıcı akışlarını test eden end-to-end testleri içerir.

## Test Kapsamı

### 1. User Registration Flow
- Yeni kullanıcı kaydı
- Email/password validation
- Session oluşturma
- Duplicate email kontrolü
- Password strength validation

### 2. Client Creation Flow
- Müşteri oluşturma
- Komisyon modeli tanımlama
- RLS policy enforcement
- Required field validation
- Müşteri listesi görüntüleme

### 3. Meta Sync Flow
- Meta API token storage
- Campaign data sync
- Ad set ve ad oluşturma
- Metrics import
- Sync failure handling

### 4. Report Generation Flow
- Rapor oluşturma (weekly/monthly)
- Date range validation
- Report list görüntüleme
- Report retrieval

### 5. Complete User Journey
- Signup'tan report generation'a tam akış
- Tüm bileşenlerin entegrasyonu
- Data consistency validation

## Test Çalıştırma

### Tüm E2E Testleri
```bash
npm run test __tests__/e2e
```

### Belirli Bir Test Dosyası
```bash
npm run test __tests__/e2e/user-flows.test.ts
```

### Watch Mode
```bash
npm run test:watch __tests__/e2e
```

## Environment Variables

E2E testleri için gerekli environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Test Database

E2E testleri, test database kullanmalıdır (production database'i kullanmayın):

1. Test database oluşturun:
```bash
npx supabase db reset --db-url postgresql://test_db_url
```

2. Test environment variables'ı ayarlayın:
```bash
export NEXT_PUBLIC_SUPABASE_URL=test_supabase_url
```

## Cleanup

Testler, `afterAll` hook'unda otomatik cleanup yapar:
- Test kullanıcıları silinir
- İlişkili tüm veriler cascade delete ile silinir

Manuel cleanup gerekirse:
```sql
DELETE FROM users WHERE email LIKE 'test-%@example.com';
```

## Best Practices

### 1. Test Isolation
Her test, diğer testlerden bağımsız çalışmalıdır:
```typescript
beforeEach(async () => {
  // Setup test data
});

afterEach(async () => {
  // Cleanup test data
});
```

### 2. Unique Test Data
Test data için unique identifiers kullanın:
```typescript
const TEST_EMAIL = `test-${Date.now()}@example.com`;
```

### 3. Error Handling
Tüm async operations için error handling:
```typescript
const { data, error } = await supabase.from('table').select();
expect(error).toBeNull();
expect(data).toBeDefined();
```

### 4. RLS Testing
RLS policies'i test edin:
```typescript
// User A creates data
// User B tries to access
// Should fail due to RLS
```

## Troubleshooting

### Test Timeout
Eğer testler timeout oluyorsa, timeout süresini artırın:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Database Connection
Database connection sorunları için:
```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start
```

### RLS Policy Issues
RLS policies test edilirken sorun yaşıyorsanız:
```sql
-- Disable RLS temporarily for debugging
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after debugging
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## CI/CD Integration

GitHub Actions workflow örneği:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run E2E tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        run: npm run test __tests__/e2e
```

## Test Coverage

E2E testleri şu acceptance criteria'ları validate eder:

- **Requirement 1**: Authentication (1.1-1.6)
- **Requirement 2**: Client Management (2.1-2.6)
- **Requirement 3**: Commission Models (3.1-3.5)
- **Requirement 4**: Meta API Integration (4.1-4.7)
- **Requirement 5**: Campaign Data Storage (5.1-5.6)
- **Requirement 9**: Report Generation (9.1-9.7)
- **Requirement 12**: Database Schema (12.1-12.13)
- **Requirement 15**: Security (15.1-15.6)

## Future Enhancements

- [ ] Playwright ile browser-based E2E tests
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Load testing
- [ ] API response time monitoring

