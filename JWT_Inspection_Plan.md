# JWT Inspection and RLS Policy Fix Plan

## Problem Analysis
- User deleted all RLS policies from Supabase
- Admin user can currently see all users (no restrictions)
- Need to recreate policies with correct JWT role path
- Current code sets role in `user_metadata`, but old policy used `raw_user_meta_data`

## Current Auth Flow
1. **Sign-in**: `signInAction` fetches role from DB and updates `user_metadata` using service role
2. **Client-side**: `useAuth` hook also updates JWT `user_metadata` with role
3. **JWT Structure**: Role is stored in `user_metadata.role` (not `raw_user_meta_data`)

## JWT Analysis Results

### ✅ Decoded JWT Structure
**Role Location**: `user_metadata.role` = "admin"

**JWT Payload Structure**:
```json
{
  "sub": "33d60fad-5292-47c4-a1ab-c1da09a48b37",
  "user_metadata": {
    "role": "admin",
    "email": "drv@outlook.com",
    "full_name": "AdminProperty"
  }
}
```

### ✅ Table Architecture: `public.users` vs `auth.users`

**Supabase Table Structure**:
- **`auth.users`**: Built-in Supabase Auth table (managed by Supabase)
  - Contains: email, password hash, auth metadata
  - Cannot be modified or have custom fields added
  - Used only for authentication

- **`public.users`**: Custom application table (user-managed)
  - Contains: id (FK to auth.users), full_name, role, status, is_active, etc.
  - Stores application-specific user profile data
  - Has RLS policies for access control
  - What the app queries for user management

**Why `public.users`?**
- Need custom fields (role, status, approval workflow)
- RLS policies control admin vs user access
- Application logic requires extended user profiles
- Standard Supabase pattern: auth.users for auth, public.users for profiles

**RLS Context**:
- Policies on `public.users` use `auth.jwt()` for role claims
- `auth.uid()` gets current user ID from JWT
- Role checking works the same regardless of table

### ✅ Correct RLS Policy Path
**WRONG**: `auth.jwt() -> 'raw_user_meta_data' ->> 'role'`
**CORRECT**: `auth.jwt() -> 'user_metadata' ->> 'role'`

## Plan Steps

### 1. ✅ JWT Inspection Complete
- Decoded provided JWT token
- Confirmed role is in `user_metadata.role`

### 2. Fix RLS Policies
- Create new migration with correct policy path
- Use `auth.jwt() -> 'user_metadata' ->> 'role'` for admin checks
- Apply policies to Supabase

### 3. Test Access Control
- Verify admin can see all users
- Verify tenant can only see own data
- Test role-based restrictions

## Implementation Details

### JWT Inspection Code
```typescript
// Get session and decode JWT
const { data: session } = await supabase.auth.getSession();
const token = session?.session?.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role in JWT:', payload.user_metadata?.role);
```

### Correct RLS Policy
```sql
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

### Files to Modify
- `src/app/admin/users/page.tsx` - Add JWT inspection
- `supabase/migrations/` - New policy migration

## Next Steps
1. Switch to Code mode to implement JWT inspection
2. Test with admin user to decode JWT
3. Create correct RLS policies
4. Verify security works properly