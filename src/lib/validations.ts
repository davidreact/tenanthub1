import { z } from 'zod';

// Property validation schema
export const propertySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  address: z.string().min(1, 'Address is required').max(200, 'Address too long'),
  description: z.string().max(500, 'Description too long').optional(),
  property_type: z.string().optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  monthly_rent: z.number().positive('Rent must be positive').max(100000, 'Rent too high').optional(),
  deposit_amount: z.number().min(0).max(100000).optional(),
  square_feet: z.number().positive().max(100000).optional(),
  square_meters: z.number().positive().max(100000).optional(),
  lease_start_date: z.string().optional(),
  lease_end_date: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
});

// Inventory item validation schema
export const inventoryItemSchema = z.object({
  item: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  location: z.string().max(100, 'Location too long').optional(),
  estimated_value: z.number().min(0).max(100000).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// User role validation (for admin operations)
export const userRoleSchema = z.object({
  role: z.enum(['admin', 'tenant']),
});

// Conversation validation schema
export const conversationSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
});

// Message validation schema
export const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

// Payment proof validation schema
export const paymentProofSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month-year format'),
  payment_date: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// Key handover validation schema
export const keyHandoverSchema = z.object({
  handover_type: z.enum(['check_in', 'check_out']),
  scheduled_date: z.string(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Tenant property validation schema
export const tenantPropertySchema = z.object({
  lease_start_date: z.string(),
  lease_end_date: z.string(),
  monthly_rent: z.number().positive('Rent must be positive'),
  deposit_paid: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
});

// UUID validation helper
export const uuidSchema = z.string().uuid('Invalid ID format');

// Email validation helper
export const emailSchema = z.string().email('Invalid email format');

// Type exports for use in components
export type PropertyInput = z.infer<typeof propertySchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type ConversationInput = z.infer<typeof conversationSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type KeyHandoverInput = z.infer<typeof keyHandoverSchema>;
export type TenantPropertyInput = z.infer<typeof tenantPropertySchema>;