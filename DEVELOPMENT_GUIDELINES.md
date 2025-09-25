# Development Guidelines

This document outlines the essential considerations and best practices for developing and maintaining this Next.js application. Follow these guidelines to ensure security, consistency, internationalization, and maintainability.

## 🔒 Security Considerations

### Authentication & Authorization
- **Always check user authentication** before accessing protected resources
- **Verify user roles** for admin-only functionality using `supabase.auth.getUser()` and role checks
- **Use server-side validation** - never trust client-side validation alone
- **Implement proper session management** with secure cookie settings

### Forms & User Input
- **All forms must include CSRF protection** using the `useCSRF` hook and validation
- **Validate all input server-side** using Zod schemas from `src/lib/validations.ts`
- **Sanitize user input** to prevent XSS attacks
- **Use secure components** like `SecurePropertyForm`, `SecurePaymentUpload`, etc.
- **Display file upload restrictions** using `FileUploadRestrictions` component

### API Routes
- **Validate CSRF tokens** on all state-changing operations (POST, PUT, PATCH, DELETE)
- **Check user authentication** and authorization in API routes
- **Use Zod validation** for all request bodies
- **Return appropriate HTTP status codes** and error messages
- **Log security events** for audit purposes

### File Uploads
- **Validate file types and sizes** before processing
- **Use secure storage** (Supabase Storage with proper bucket policies)
- **Scan files for malware** (implement if needed for production)
- **Generate secure, unpredictable filenames**
- **Display upload restrictions** to users via `FileUploadRestrictions` component

## 🌍 Internationalization (i18n)

### Translation Keys
- **Use the `useLanguage` hook** and `t()` function for all user-facing text
- **Add new translation keys** to `src/lib/i18n.ts` when creating new UI text
- **Use descriptive key names** that indicate context (e.g., `common.saveButton`, `properties.addNew`)
- **Support pluralization** where appropriate
- **Test translations** in different languages before deployment

### Component Development
- **Import and use translations** in all components with user-facing text
- **Provide fallback text** for missing translations
- **Use proper interpolation** for dynamic content: `t("welcome.message", { name: userName })`
- **Avoid hardcoded strings** in components

## 🧩 Component Development

### Security Components
- **Use secure form components** for any data submission
- **Include CSRF protection** in custom forms
- **Validate props** and handle error states
- **Implement proper loading states** during async operations

### UI Components
- **Follow the design system** using shadcn/ui components
- **Use consistent styling** with Tailwind CSS classes
- **Implement responsive design** for mobile and desktop
- **Add proper ARIA labels** for accessibility
- **Handle loading and error states** appropriately

### State Management
- **Use React hooks** for local component state
- **Leverage Supabase** for server state and real-time updates
- **Implement proper error boundaries** for error handling
- **Avoid prop drilling** - use context when appropriate

## 🚀 API Development

### Route Structure
- **Use RESTful conventions** for API endpoints
- **Implement proper HTTP methods** (GET, POST, PUT, PATCH, DELETE)
- **Version APIs** if needed for breaking changes
- **Document API endpoints** with JSDoc comments

### Error Handling
- **Return consistent error responses** with proper status codes
- **Don't expose sensitive information** in error messages
- **Log errors appropriately** for debugging
- **Handle edge cases** and unexpected inputs

### Database Operations
- **Use Supabase client** for all database interactions
- **Implement proper error handling** for database operations
- **Use transactions** for multi-step operations
- **Validate data integrity** before database writes

## 📱 Performance Considerations

### Code Splitting
- **Use dynamic imports** for large components
- **Implement route-based code splitting** with Next.js
- **Lazy load images** using Next.js Image component
- **Bundle analysis** to identify large dependencies

### Database Optimization
- **Use appropriate indexes** on frequently queried columns
- **Implement pagination** for large datasets
- **Cache frequently accessed data** when appropriate
- **Optimize database queries** to reduce N+1 problems

### Frontend Optimization
- **Minimize bundle size** by tree-shaking unused code
- **Use React.memo** for expensive components
- **Implement virtual scrolling** for large lists
- **Optimize images** and use modern formats (WebP)

## 🧪 Testing Guidelines

### Unit Tests
- **Test component logic** and user interactions
- **Mock external dependencies** (Supabase, API calls)
- **Test error states** and edge cases
- **Use descriptive test names** that explain the behavior

### Integration Tests
- **Test API endpoints** with various inputs
- **Verify authentication flows**
- **Test database operations** and constraints
- **Ensure proper error handling**

### E2E Tests
- **Test critical user journeys** (login, form submission, file uploads)
- **Verify security features** work as expected
- **Test responsive design** across devices
- **Validate accessibility** compliance

## 🚀 Deployment & Production

### Environment Variables
- **Never commit secrets** to version control
- **Use different configs** for development, staging, and production
- **Validate required environment variables** on startup
- **Document all environment variables** in README

### Build Process
- **Run security audits** before deployment (`npm audit`)
- **Validate TypeScript** compilation without errors
- **Test build output** in staging environment
- **Monitor bundle size** and performance metrics

### Monitoring & Logging
- **Implement error tracking** (Sentry, LogRocket)
- **Monitor performance metrics** (Core Web Vitals)
- **Log security events** for audit purposes
- **Set up alerts** for critical errors

## 📋 Code Quality Standards

### TypeScript
- **Use strict type checking** - no `any` types without justification
- **Define proper interfaces** for component props and API responses
- **Use union types** for constrained values (status enums, etc.)
- **Leverage generics** where appropriate

### Code Style
- **Follow ESLint rules** and Prettier formatting
- **Use descriptive variable names** that explain purpose
- **Write self-documenting code** with clear logic flow
- **Add JSDoc comments** for complex functions

### Git Workflow
- **Use descriptive commit messages** following conventional commits
- **Create feature branches** for new work
- **Write clear PR descriptions** explaining changes and rationale
- **Review code thoroughly** before merging

## 🔧 Maintenance Tasks

### Regular Updates
- **Keep dependencies updated** and review changelogs
- **Monitor security advisories** and apply patches promptly
- **Update Node.js and Next.js** versions regularly
- **Review and optimize database performance**

### Code Reviews
- **Review security implications** of all changes
- **Check for proper error handling** and validation
- **Verify translations** are included for new text
- **Ensure tests** are written/updated for new features

### Documentation
- **Keep this guidelines document updated** as practices evolve
- **Document new components** and their usage
- **Update API documentation** for endpoint changes
- **Maintain changelog** for version releases

## 🚨 Security Checklist (Pre-Deployment)

- [ ] All forms include CSRF protection
- [ ] Input validation implemented server-side
- [ ] File uploads are restricted and validated
- [ ] Authentication checks in place for protected routes
- [ ] Authorization verified for admin operations
- [ ] No sensitive data exposed in client-side code
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Error messages don't leak sensitive information

## 🌐 Accessibility Checklist

- [ ] Semantic HTML elements used appropriately
- [ ] ARIA labels provided for screen readers
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG guidelines
- [ ] Focus indicators are visible and clear
- [ ] Alt text provided for all images
- [ ] Form labels associated with inputs
- [ ] Error messages are accessible

Remember: Security and user experience should be prioritized in all development decisions. When in doubt, err on the side of caution and consult with the team for complex changes.