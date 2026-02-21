# GrowthPilot AI - Component Documentation

Bu dokümantasyon, GrowthPilot AI platformunun tüm React componentlerini, props'larını ve kullanım örneklerini içerir.

## İçindekiler

1. [Authentication Components](#authentication-components)
2. [Dashboard Components](#dashboard-components)
3. [Client Management Components](#client-management-components)
4. [Campaign Components](#campaign-components)
5. [AI Components](#ai-components)
6. [Report Components](#report-components)
7. [Creative Generator Components](#creative-generator-components)
8. [Lead Management Components](#lead-management-components)
9. [UI Components](#ui-components)

---

## Authentication Components

### LoginForm

Email/password ile kullanıcı girişi formu.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}
```

**Usage:**
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="container">
      <LoginForm 
        onSuccess={() => console.log('Login successful')}
        redirectTo="/dashboard"
      />
    </div>
  );
}
```

**Features:**
- Email ve password validation
- Error handling ve kullanıcı dostu mesajlar
- Loading state
- "Beni hatırla" checkbox
- "Şifremi unuttum" linki

---

### SignupForm

Yeni kullanıcı kaydı formu.

**Props:**
```typescript
interface SignupFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}
```

**Usage:**
```tsx
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="container">
      <SignupForm 
        onSuccess={() => console.log('Signup successful')}
        redirectTo="/dashboard"
      />
    </div>
  );
}
```

**Features:**
- Email, password, fullName validation
- Password strength indicator
- Terms & conditions checkbox
- Email verification flow
- Error handling

---

### GoogleAuthButton

Google OAuth ile giriş butonu.

**Props:**
```typescript
interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

**Usage:**
```tsx
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  return (
    <GoogleAuthButton 
      onSuccess={() => console.log('Google auth successful')}
      onError={(error) => console.error(error)}
    />
  );
}
```

---

## Dashboard Components

### DashboardLayout

Ana dashboard layout component'i (sidebar, header, content area).

**Props:**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Usage:**
```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1>Dashboard Content</h1>
    </DashboardLayout>
  );
}
```

**Features:**
- Responsive sidebar navigation
- User profile dropdown
- Notification center
- Logout functionality
- Active route highlighting

---

### OverviewCards

Dashboard özet kartları (müşteri sayısı, harcama, gelir, kampanya).

**Props:**
```typescript
interface OverviewCardsProps {
  clientId?: string; // Optional: Belirli bir müşteri için filtrele
  period?: 'today' | 'this_month' | 'last_30_days';
}
```

**Usage:**
```tsx
import { OverviewCards } from '@/components/dashboard/OverviewCards';

export default function OverviewPage() {
  return (
    <div>
      <OverviewCards period="this_month" />
      {/* Belirli bir müşteri için */}
      <OverviewCards clientId="uuid" period="this_month" />
    </div>
  );
}
```

**Features:**
- Real-time data fetching
- Loading skeletons
- Error handling
- Turkish locale formatting (₺1.234,56)
- Responsive grid layout

---

### NotificationCenter

Bildirim merkezi dropdown component'i.

**Props:**
```typescript
interface NotificationCenterProps {
  maxVisible?: number; // Default: 5
}
```

**Usage:**
```tsx
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';

// Header içinde kullanım
export function Header() {
  return (
    <header>
      <NotificationCenter maxVisible={10} />
    </header>
  );
}
```

**Features:**
- Unread count badge
- Click to mark as read
- Notification types (roas_alert, budget_alert, sync_error)
- Auto-refresh every 30 seconds
- Empty state

---

### AccountSettings

Kullanıcı hesap ayarları component'i.

**Props:**
```typescript
interface AccountSettingsProps {
  onUpdate?: () => void;
}
```

**Usage:**
```tsx
import { AccountSettings } from '@/components/dashboard/AccountSettings';

export default function SettingsPage() {
  return (
    <AccountSettings 
      onUpdate={() => console.log('Settings updated')}
    />
  );
}
```

**Features:**
- Email güncelleme
- Password değiştirme
- Account deletion (GDPR compliant)
- Confirmation dialogs

---

## Client Management Components

### ClientList

Müşteri listesi tablosu (pagination, search, filter).

**Props:**
```typescript
interface ClientListProps {
  onClientSelect?: (clientId: string) => void;
  searchable?: boolean; // Default: true
  pageSize?: number; // Default: 50
}
```

**Usage:**
```tsx
import { ClientList } from '@/components/clients/ClientList';

export default function ClientsPage() {
  return (
    <ClientList 
      onClientSelect={(id) => console.log('Selected:', id)}
      searchable={true}
      pageSize={50}
    />
  );
}
```

**Features:**
- Pagination (50 records per page)
- Search by name or industry
- Sort by name, created_at
- Edit/Delete actions
- Empty state
- Loading skeletons

---

### ClientForm

Müşteri oluşturma/düzenleme formu.

**Props:**
```typescript
interface ClientFormProps {
  clientId?: string; // Edit mode için
  onSuccess?: (client: Client) => void;
  onCancel?: () => void;
}
```

**Usage:**
```tsx
import { ClientForm } from '@/components/clients/ClientForm';

// Yeni müşteri oluşturma
<ClientForm 
  onSuccess={(client) => console.log('Created:', client)}
  onCancel={() => setShowForm(false)}
/>

// Müşteri düzenleme
<ClientForm 
  clientId="uuid"
  onSuccess={(client) => console.log('Updated:', client)}
/>
```

**Features:**
- Name, industry, contact_email, contact_phone fields
- Validation (name required, email format)
- Industry dropdown (logistics, e-commerce, beauty, real estate, healthcare, education)
- Error handling
- Loading state

---

### CommissionForm

Komisyon modeli tanımlama formu.

**Props:**
```typescript
interface CommissionFormProps {
  clientId: string;
  modelId?: string; // Edit mode için
  onSuccess?: (model: CommissionModel) => void;
}
```

**Usage:**
```tsx
import { CommissionForm } from '@/components/clients/CommissionForm';

<CommissionForm 
  clientId="uuid"
  onSuccess={(model) => console.log('Commission model saved:', model)}
/>
```

**Features:**
- Commission percentage input (0-100)
- Calculation basis selector (sales_revenue, total_revenue)
- Real-time validation
- Preview calculation
- Turkish locale number formatting

---

## Campaign Components

### CampaignList

Kampanya listesi (hierarchical: Campaign > Ad Set > Ad).

**Props:**
```typescript
interface CampaignListProps {
  clientId?: string; // Optional: Belirli bir müşteri
  expandable?: boolean; // Default: true
  showMetrics?: boolean; // Default: true
}
```

**Usage:**
```tsx
import { CampaignList } from '@/components/campaigns/CampaignList';

// Tüm kampanyalar
<CampaignList expandable={true} showMetrics={true} />

// Belirli bir müşterinin kampanyaları
<CampaignList clientId="uuid" />
```

**Features:**
- Hierarchical tree view (Campaign > Ad Set > Ad)
- Expandable/collapsible rows
- Status badges (ACTIVE, PAUSED, ARCHIVED)
- Inline metrics display
- Pagination (50 campaigns per page)
- Manual sync button

---

### MetricsTable

Kampanya metrikleri tablosu.

**Props:**
```typescript
interface MetricsTableProps {
  adId?: string;
  campaignId?: string;
  dateRange?: { start: string; end: string };
  metrics?: string[]; // Default: all metrics
}
```

**Usage:**
```tsx
import { MetricsTable } from '@/components/campaigns/MetricsTable';

<MetricsTable 
  campaignId="uuid"
  dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
  metrics={['spend', 'roas', 'ctr', 'conversions']}
/>
```

**Features:**
- Sortable columns
- Turkish locale formatting
- Color-coded values (green for good, red for bad)
- Responsive table
- Export to CSV

**Metrics:**
- spend (Harcama)
- roas (ROAS)
- ctr (CTR %)
- cpc (CPC)
- cpm (CPM)
- cpa (CPA)
- frequency (Frekans)
- add_to_cart (Sepete Ekleme)
- purchases (Satın Alma)
- conversions (Dönüşüm)

---

### CampaignListWrapper

Campaign list için wrapper component (filters, search).

**Props:**
```typescript
interface CampaignListWrapperProps {
  defaultClientId?: string;
}
```

**Usage:**
```tsx
import { CampaignListWrapper } from '@/components/campaigns/CampaignListWrapper';

export default function CampaignsPage() {
  return <CampaignListWrapper />;
}
```

**Features:**
- Client filter dropdown
- Status filter
- Date range picker
- Search by campaign name
- Sync all button

---

## AI Components

### ActionPlanCard

Günlük aksiyon planı kartı (top 3 priority actions).

**Props:**
```typescript
interface ActionPlanCardProps {
  clientId?: string; // Optional: Belirli bir müşteri
  onActionComplete?: (actionId: string) => void;
  autoRefresh?: boolean; // Default: true
}
```

**Usage:**
```tsx
import { ActionPlanCard } from '@/components/ai/ActionPlanCard';

<ActionPlanCard 
  clientId="uuid"
  onActionComplete={(id) => console.log('Action completed:', id)}
  autoRefresh={true}
/>
```

**Features:**
- Top 3 priority actions
- Priority badges (Yüksek, Orta, Düşük)
- Checkbox to mark complete
- Expected impact display
- Auto-refresh daily
- Empty state (no actions)

**Action Structure:**
```typescript
interface Action {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
}
```

---

### StrategyCard

Strateji kartı (Do's & Don'ts).

**Props:**
```typescript
interface StrategyCardProps {
  campaignId: string;
  onDismiss?: (cardId: string) => void;
  showReasoning?: boolean; // Default: true
}
```

**Usage:**
```tsx
import { StrategyCard } from '@/components/ai/StrategyCard';

<StrategyCard 
  campaignId="uuid"
  onDismiss={(id) => console.log('Card dismissed:', id)}
  showReasoning={true}
/>
```

**Features:**
- Green "Yapılması Gerekenler" section
- Red "Yapılmaması Gerekenler" section
- Reasoning/explanation
- Dismiss button
- Metric-based triggers (frequency > 4, ROAS < 2, etc.)

**Card Structure:**
```typescript
interface StrategyCardData {
  do_actions: string[];
  dont_actions: string[];
  reasoning: string;
}
```

---

## Report Components

### ReportGenerator

Rapor oluşturma formu.

**Props:**
```typescript
interface ReportGeneratorProps {
  clientId?: string; // Pre-select client
  onSuccess?: (report: Report) => void;
}
```

**Usage:**
```tsx
import { ReportGenerator } from '@/components/reports/ReportGenerator';

<ReportGenerator 
  clientId="uuid"
  onSuccess={(report) => console.log('Report generated:', report)}
/>
```

**Features:**
- Client selector dropdown
- Report type (Haftalık, Aylık)
- Date range picker
- Metrics checkboxes (spend, revenue, roas, leads, cost_per_lead)
- Format selector (WhatsApp, PDF)
- Preview before download
- Async processing with progress indicator

---

### ReportHistory

Oluşturulan raporların listesi.

**Props:**
```typescript
interface ReportHistoryProps {
  clientId?: string; // Optional: Belirli bir müşteri
  pageSize?: number; // Default: 20
}
```

**Usage:**
```tsx
import { ReportHistory } from '@/components/reports/ReportHistory';

// Tüm raporlar
<ReportHistory pageSize={20} />

// Belirli bir müşterinin raporları
<ReportHistory clientId="uuid" />
```

**Features:**
- Pagination
- Filter by client, report type
- Download button
- Delete button
- Date formatting (DD.MM.YYYY)
- File size display

---

## Creative Generator Components

### CreativeGenerator

Kreatif içerik üretici formu.

**Props:**
```typescript
interface CreativeGeneratorProps {
  onSave?: (creative: Creative) => void;
}
```

**Usage:**
```tsx
import { CreativeGenerator } from '@/components/creative/CreativeGenerator';

<CreativeGenerator 
  onSave={(creative) => console.log('Creative saved:', creative)}
/>
```

**Features:**
- Industry selector (logistics, e-commerce, beauty, real estate, healthcare, education)
- Content type selector (Reklam Metni, Video Senaryosu, Seslendirme)
- Target audience input
- Campaign objective input
- Tone selector (Samimi, Profesyonel, Eğlenceli, Güvenilir)
- Generate button (3 variations)
- Editable textarea
- Save to library button
- Copy to clipboard

**Generated Content Structure:**
```typescript
interface CreativeVariation {
  title: string;
  content: string;
  cta: string;
}
```

---

## Lead Management Components

### LeadList

Lead listesi tablosu (conversion status toggle).

**Props:**
```typescript
interface LeadListProps {
  adId?: string; // Optional: Belirli bir reklam
  campaignId?: string; // Optional: Belirli bir kampanya
  onStatusChange?: (leadId: string, status: boolean) => void;
  pageSize?: number; // Default: 50
}
```

**Usage:**
```tsx
import { LeadList } from '@/components/leads/LeadList';

// Tüm lead'ler
<LeadList 
  onStatusChange={(id, status) => console.log('Lead status changed:', id, status)}
/>

// Belirli bir kampanyanın lead'leri
<LeadList campaignId="uuid" />
```

**Features:**
- Toggle buttons (Dönüştü / Dönüşmedi)
- Contact info display
- Lead source badge
- Date formatting (DD.MM.YYYY)
- Pagination
- Filter by conversion status

---

### LeadQualityMetrics

Lead kalite metrikleri (conversion rates).

**Props:**
```typescript
interface LeadQualityMetricsProps {
  campaignId?: string;
  adId?: string;
  showChart?: boolean; // Default: true
}
```

**Usage:**
```tsx
import { LeadQualityMetrics } from '@/components/leads/LeadQualityMetrics';

// Kampanya bazında
<LeadQualityMetrics campaignId="uuid" showChart={true} />

// Reklam bazında
<LeadQualityMetrics adId="uuid" />
```

**Features:**
- Conversion rate per campaign
- Conversion rate per ad
- Bar chart visualization
- Color-coded rates (green > 30%, yellow 15-30%, red < 15%)
- Total leads vs converted leads

---

## UI Components (Shadcn/UI)

### Button

Temel buton component'i.

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="default">
  Kaydet
</Button>

<Button variant="destructive" loading={isLoading}>
  Sil
</Button>
```

---

### Card

Kart container component'i.

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Başlık</CardTitle>
    <CardDescription>Açıklama</CardDescription>
  </CardHeader>
  <CardContent>
    İçerik
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

---

### Dialog

Modal dialog component'i.

**Usage:**
```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Dialog Aç</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Başlık</DialogTitle>
      <DialogDescription>Açıklama</DialogDescription>
    </DialogHeader>
    <div>Dialog içeriği</div>
  </DialogContent>
</Dialog>
```

---

### Form

Form component'i (react-hook-form ile entegre).

**Usage:**
```tsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="email@example.com" {...field} />
          </FormControl>
          <FormDescription>Email adresinizi girin</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

---

### Input

Text input component'i.

**Usage:**
```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="text" 
  placeholder="Müşteri adı" 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Select

Dropdown select component'i.

**Usage:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select onValueChange={setValue} defaultValue={value}>
  <SelectTrigger>
    <SelectValue placeholder="Sektör seçin" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="e-commerce">E-Ticaret</SelectItem>
    <SelectItem value="logistics">Lojistik</SelectItem>
    <SelectItem value="beauty">Güzellik</SelectItem>
  </SelectContent>
</Select>
```

---

### Table

Tablo component'i.

**Usage:**
```tsx
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableCaption>Müşteri listesi</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>İsim</TableHead>
      <TableHead>Sektör</TableHead>
      <TableHead>İşlemler</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>ABC Şirketi</TableCell>
      <TableCell>E-Ticaret</TableCell>
      <TableCell>
        <Button size="sm">Düzenle</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Toast

Toast notification component'i.

**Usage:**
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success toast
toast({
  title: "Başarılı",
  description: "Müşteri başarıyla oluşturuldu",
});

// Error toast
toast({
  title: "Hata",
  description: "Bir hata oluştu",
  variant: "destructive",
});
```

---

### ErrorBoundary

Hata yakalama component'i.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary fallback={<div>Bir hata oluştu</div>}>
  <YourComponent />
</ErrorBoundary>
```

---

### FormField

Form field wrapper (validation ile).

**Props:**
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

**Usage:**
```tsx
import { FormField } from '@/components/ui/form-field';

<FormField 
  label="Müşteri Adı" 
  error={errors.name?.message}
  required={true}
>
  <Input {...register('name')} />
</FormField>
```

---

## Custom Hooks

### useAuth

Authentication hook.

**Returns:**
```typescript
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Usage:**
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;
  if (!user) return <div>Giriş yapın</div>;

  return (
    <div>
      <p>Hoş geldiniz, {user.email}</p>
      <button onClick={signOut}>Çıkış Yap</button>
    </div>
  );
}
```

---

### useToast

Toast notification hook.

**Returns:**
```typescript
interface UseToastReturn {
  toast: (options: ToastOptions) => void;
  dismiss: (toastId?: string) => void;
}
```

**Usage:**
```tsx
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Başarılı",
      description: "İşlem tamamlandı",
    });
  };

  return <button onClick={handleSuccess}>İşlem Yap</button>;
}
```

---

### useFormValidation

Form validation hook.

**Returns:**
```typescript
interface UseFormValidationReturn {
  errors: Record<string, string>;
  validate: (field: string, value: any) => boolean;
  validateAll: (values: Record<string, any>) => boolean;
  clearErrors: () => void;
}
```

**Usage:**
```tsx
import { useFormValidation } from '@/hooks/use-form-validation';

function MyForm() {
  const { errors, validate, validateAll } = useFormValidation({
    email: { required: true, email: true },
    name: { required: true, minLength: 2 },
  });

  const handleSubmit = (values) => {
    if (validateAll(values)) {
      // Submit form
    }
  };

  return (
    <form>
      <input 
        name="email" 
        onBlur={(e) => validate('email', e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}
    </form>
  );
}
```

---

### useSessionAwareApi

Session-aware API call hook (auto-retry on session expiry).

**Returns:**
```typescript
interface UseSessionAwareApiReturn {
  call: <T>(apiCall: () => Promise<T>) => Promise<T>;
  loading: boolean;
  error: Error | null;
}
```

**Usage:**
```tsx
import { useSessionAwareApi } from '@/hooks/use-session-aware-api';

function MyComponent() {
  const { call, loading, error } = useSessionAwareApi();

  const fetchData = async () => {
    const data = await call(() => 
      fetch('/api/clients').then(r => r.json())
    );
    console.log(data);
  };

  return (
    <button onClick={fetchData} disabled={loading}>
      {loading ? 'Yükleniyor...' : 'Veri Getir'}
    </button>
  );
}
```

---

## Best Practices

### Component Organization

```tsx
// 1. Imports
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface MyComponentProps {
  title: string;
  onSave: () => void;
}

// 3. Component
export function MyComponent({ title, onSave }: MyComponentProps) {
  // 4. State
  const [loading, setLoading] = React.useState(false);

  // 5. Effects
  React.useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleClick = () => {
    setLoading(true);
    onSave();
  };

  // 7. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} loading={loading}>
        Kaydet
      </Button>
    </div>
  );
}
```

---

### Error Handling

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleError = (error: Error) => {
    toast({
      title: "Hata",
      description: error.message,
      variant: "destructive",
    });
  };

  return (
    <ErrorBoundary fallback={<div>Bir hata oluştu</div>}>
      {/* Component content */}
    </ErrorBoundary>
  );
}
```

---

### Loading States

```tsx
function MyComponent() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!data) {
    return <div>Veri bulunamadı</div>;
  }

  return <div>{/* Render data */}</div>;
}
```

---

### Turkish Locale Formatting

```tsx
import { formatCurrency, formatDate } from '@/lib/utils/locale';

function MetricsDisplay({ spend, date }) {
  return (
    <div>
      <p>Harcama: {formatCurrency(spend)}</p>
      {/* Output: ₺1.234,56 */}
      
      <p>Tarih: {formatDate(date)}</p>
      {/* Output: 15.01.2024 */}
    </div>
  );
}
```

---

## Testing Components

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientForm } from '@/components/clients/ClientForm';

describe('ClientForm', () => {
  it('should render form fields', () => {
    render(<ClientForm />);
    
    expect(screen.getByLabelText('Müşteri Adı')).toBeInTheDocument();
    expect(screen.getByLabelText('Sektör')).toBeInTheDocument();
  });

  it('should call onSuccess when form is submitted', async () => {
    const onSuccess = jest.fn();
    render(<ClientForm onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Müşteri Adı'), {
      target: { value: 'Test Şirketi' }
    });
    
    fireEvent.click(screen.getByText('Kaydet'));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial component library release
- Authentication components
- Dashboard components
- Client management components
- Campaign components
- AI components
- Report components
- Creative generator components
- Lead management components
- UI components (Shadcn/UI)

---

## Support

Component dokümantasyonu ile ilgili sorularınız için:
- Email: support@growthpilot.ai
- Documentation: https://docs.growthpilot.ai
- GitHub: https://github.com/growthpilot/growthpilot-ai

