import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

// Generate a random CSRF token
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

// Get CSRF token from cookies
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get('csrf-token')?.value;

  if (!token) {
    token = generateCSRFToken();
    // Set cookie with secure options
    cookieStore.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  return token;
}

// Validate CSRF token from request
export async function validateCSRFToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('csrf-token')?.value;

  if (!cookieToken) {
    return false;
  }

  // Check if request is POST, PUT, PATCH, or DELETE
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true; // Allow safe methods
  }

  try {
    const body = await request.clone().json();
    const requestToken = body.csrfToken;

    return requestToken === cookieToken;
  } catch {
    // If body can't be parsed as JSON, check form data
    const formData = await request.clone().formData();
    const requestToken = formData.get('csrfToken') as string;

    return requestToken === cookieToken;
  }
}

// Middleware function for API routes
export async function withCSRFProtection(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return handler();
}