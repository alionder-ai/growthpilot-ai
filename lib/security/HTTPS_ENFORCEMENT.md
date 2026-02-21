# HTTPS Enforcement

## Overview

GrowthPilot AI enforces HTTPS for all connections to ensure data security during transmission.
Validates Requirements: 15.2

## Implementation

### Vercel Automatic HTTPS

When deployed on Vercel (recommended platform):
- Vercel automatically provides SSL/TLS certificates via Let's Encrypt
- All HTTP requests are automatically redirected to HTTPS
- Certificates are automatically renewed before expiration
- No manual configuration required

### Middleware HTTPS Redirect

As an additional safeguard, the application middleware includes HTTPS enforcement:

```typescript
// middleware.ts
if (
  process.env.NODE_ENV === 'production' &&
  request.headers.get('x-forwarded-proto') !== 'https'
) {
  const httpsUrl = new URL(request.url);
  httpsUrl.protocol = 'https:';
  return NextResponse.redirect(httpsUrl, 301);
}
```

This ensures:
- All production traffic uses HTTPS
- HTTP requests receive a 301 permanent redirect to HTTPS
- Development environment (localhost) is not affected

## Verification

### Manual Testing

1. **Production Deployment**:
   ```bash
   # Try accessing via HTTP
   curl -I http://your-domain.com
   # Should return: 301 Moved Permanently
   # Location: https://your-domain.com
   ```

2. **HTTPS Connection**:
   ```bash
   # Verify HTTPS works
   curl -I https://your-domain.com
   # Should return: 200 OK
   ```

3. **SSL Certificate Check**:
   ```bash
   # Check certificate validity
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

### Browser Testing

1. Open browser and navigate to `http://your-domain.com`
2. Browser should automatically redirect to `https://your-domain.com`
3. Check for secure padlock icon in address bar
4. Click padlock to verify certificate details

## Security Headers

In addition to HTTPS, consider adding security headers in `next.config.mjs`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

### Header Explanations

- **Strict-Transport-Security (HSTS)**: Forces browsers to only use HTTPS for 1 year
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls referrer information sent with requests

## Local Development

During local development:
- HTTPS enforcement is disabled (NODE_ENV !== 'production')
- Use `http://localhost:3000` for development
- Supabase and external APIs still use HTTPS

## Troubleshooting

### Issue: Redirect Loop

**Symptom**: Browser shows "too many redirects" error

**Solution**: Check that your hosting provider correctly sets the `x-forwarded-proto` header

### Issue: Mixed Content Warnings

**Symptom**: Browser console shows "Mixed Content" warnings

**Solution**: Ensure all external resources (images, scripts, APIs) use HTTPS URLs

### Issue: Certificate Errors

**Symptom**: Browser shows "Your connection is not private"

**Solution**: 
- Wait for Vercel to provision certificate (can take a few minutes)
- Verify domain DNS settings are correct
- Check that domain is properly added to Vercel project

## Compliance

HTTPS enforcement ensures compliance with:
- **GDPR**: Secure transmission of personal data
- **PCI DSS**: Required for handling payment information (if applicable)
- **Turkish Data Protection Law (KVKK)**: Secure data transmission requirements

## Related Requirements

- Requirement 15.1: Encrypt Meta API access tokens at rest using AES-256
- Requirement 15.2: Transmit all data over HTTPS ✓
- Requirement 15.3: Implement RLS policies to prevent users from accessing other users' data
- Requirement 15.4: Hash passwords using bcrypt with minimum 10 salt rounds
