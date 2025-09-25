// In-memory rate limiter for serverless environments
class InMemoryRateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async check(identifier: string): Promise<{ success: boolean; reset: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the current window
    const validRequests = existingRequests.filter((time: number) => time > windowStart);

    if (validRequests.length >= this.maxRequests) {
      // Rate limit exceeded
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + this.windowMs;
      return { success: false, reset: resetTime };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      this.cleanup();
    }

    return { success: true, reset: now + this.windowMs };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const keysToDelete: string[] = [];

    this.requests.forEach((requests, key) => {
      const validRequests = requests.filter((time: number) => time > windowStart);
      if (validRequests.length === 0) {
        keysToDelete.push(key);
      } else {
        this.requests.set(key, validRequests);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

// Rate limiters for different endpoint types
export const authRateLimit = new InMemoryRateLimiter(5, 10000); // 5 requests per 10 seconds
export const apiRateLimit = new InMemoryRateLimiter(20, 60000); // 20 requests per minute
export const adminRateLimit = new InMemoryRateLimiter(10, 60000); // 10 requests per minute

// Utility function to get rate limiter
export async function getRateLimit(
  type: 'auth' | 'api' | 'admin',
  identifier: string
): Promise<{ success: boolean; reset: number }> {
  let limiter: InMemoryRateLimiter;

  switch (type) {
    case 'auth':
      limiter = authRateLimit;
      break;
    case 'api':
      limiter = apiRateLimit;
      break;
    case 'admin':
      limiter = adminRateLimit;
      break;
    default:
      limiter = apiRateLimit;
  }

  return await limiter.check(identifier);
}

// Middleware function for rate limiting
export async function withRateLimit(
  request: Request,
  type: 'auth' | 'api' | 'admin' = 'api',
  handler: () => Promise<Response>
): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const identifier = `${type}:${ip}`;

  const rateLimitResult = await getRateLimit(type, identifier);

  if (!rateLimitResult.success) {
    const resetTime = new Date(rateLimitResult.reset);
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter,
        resetTime: resetTime.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Reset': resetTime.toISOString(),
        },
      }
    );
  }

  return handler();
}