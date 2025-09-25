# Security Implementation Guide

This document outlines the security enhancements implemented for the admin pages and provides guidance on how to apply them throughout the application.

## Implemented Security Features

### 1. Role-Based Access Control ✅
- **Location**: `src/app/admin/layout.tsx`
- **Purpose**: Ensures only admin users can access admin pages
- **Implementation**: Server-side role checking before rendering admin content

### 2. Rate Limiting ✅
- **Location**: `src/lib/rate-limit.ts`, `src/app/actions.ts`
- **Purpose**: Prevents brute force attacks and DoS attempts on authentication endpoints
- **Implementation**: In-memory rate limiter with configurable limits
- **Limits**:
  - **Authentication endpoints**: 5 requests per 10 seconds
  - **General API**: 20 requests per minute
  - **Admin endpoints**: 10 requests per minute
- **Applied to**: Sign-in, sign-up, password reset, and tenant creation actions

### 2. HTTPS Security Headers ✅
- **Location**: `next.config.js`
- **Purpose**: Protects against common web vulnerabilities
- **Headers Added**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` (production only)

### 3. Input Validation & Sanitization ✅
- **Location**: `src/lib/validations.ts`
- **Purpose**: Validates and sanitizes all user input
- **Implementation**: Zod schemas for type-safe validation

### 4. CSRF Protection ✅
- **Location**:
  - `src/lib/csrf.ts` - Core CSRF utilities
  - `src/hooks/useCSRF.ts` - React hook for components
  - `src/app/api/csrf-token/route.ts` - API endpoint for tokens
- **Purpose**: Prevents Cross-Site Request Forgery attacks

## How to Use These Security Features

### Using Input Validation

```typescript
import { propertySchema } from '@/lib/validations';

// In your API route
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = propertySchema.parse(body); // Throws on invalid data
  // Process validatedData...
}
```

### Using CSRF Protection

```typescript
// In your component
import { useCSRF } from '@/hooks/useCSRF';

function MyForm() {
  const { csrfToken, loading, error } = useCSRF();

  const handleSubmit = async (data) => {
    await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, csrfToken }),
    });
  };
}

// In your API route
import { validateCSRFToken } from '@/lib/csrf';

export async function POST(request: Request) {
  const isValid = await validateCSRFToken(request);
  if (!isValid) {
    return new Response('Invalid CSRF token', { status: 403 });
  }
  // Process request...
}
```

### Using the Secure Form Component

```typescript
import { SecurePropertyForm } from '@/components/SecurePropertyForm';

function MyPage() {
  return (
    <SecurePropertyForm
      onSuccess={() => console.log('Property created')}
      onCancel={() => console.log('Cancelled')}
      initialData={existingProperty} // For editing
      isEditing={true}
    />
  );
}
```

## Applying Security to Other Admin Features

### 1. Update Existing Forms
Replace manual form handling with validated, CSRF-protected forms:

```typescript
// Before (insecure)
const handleSubmit = (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  // No validation, no CSRF
  createSomething(data);
};

// After (secure)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCSRF } from '@/hooks/useCSRF';

const schema = z.object({ /* validation rules */ });

function SecureForm() {
  const { csrfToken } = useCSRF();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ ...data, csrfToken })
    });
  };
}
```

### 2. Secure API Routes
Add validation and CSRF protection to all admin API routes:

```typescript
// /api/admin/something/route.ts
import { validateCSRFToken } from '@/lib/csrf';
import { someSchema } from '@/lib/validations';

export async function POST(request: Request) {
  // CSRF validation
  if (!(await validateCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const body = await request.json();
  const { csrfToken, ...data } = body;

  // Input validation
  const validatedData = someSchema.parse(data);

  // Process...
}
```

### 3. Add Role Checks to Other Admin Routes
For routes that need specific permissions beyond basic admin access:

```typescript
// In admin layout or specific pages
const supabase = await createClient();
const { data: userData } = await supabase
  .from('users')
  .select('role, permissions')
  .eq('id', user.id)
  .single();

if (userData.role !== 'admin' || !userData.permissions?.includes('manage_users')) {
  redirect('/dashboard');
}
```

## Security Testing Checklist

- [ ] All forms use input validation
- [ ] All state-changing requests include CSRF tokens
- [ ] Admin routes check user roles
- [ ] HTTPS headers are applied
- [ ] Sensitive data is properly sanitized
- [ ] Error messages don't leak information
- [x] Rate limiting is implemented for auth endpoints

## Next Steps

1. **Apply to existing forms**: Update all admin forms to use the secure patterns
2. **Database security**: Review and enhance RLS policies
3. **Audit logging**: Add logging for admin actions
4. **Regular updates**: Keep dependencies updated for security patches

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/architecture/security)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth)