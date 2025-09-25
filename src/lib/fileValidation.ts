import { z } from 'zod';

// File validation schema
export const fileValidationSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"].includes(
          file.type
        ),
      {
        message: "File must be a valid image (JPEG, PNG, GIF) or PDF",
      }
    ),
});

// Payment proof validation schema
export const paymentProofSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month-year format"),
  amount: z.number().positive("Amount must be positive").max(10000, "Amount too high"),
  paymentDate: z.string().refine((date) => {
    const paymentDate = new Date(date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return paymentDate >= oneYearAgo && paymentDate <= now;
  }, "Payment date must be within the last year"),
});

// Combined payment proof with file validation
export const securePaymentProofSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month-year format"),
  amount: z.number().positive("Amount must be positive").max(10000, "Amount too high"),
  paymentDate: z.string().refine((date) => {
    const paymentDate = new Date(date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return paymentDate >= oneYearAgo && paymentDate <= now;
  }, "Payment date must be within the last year"),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"].includes(
          file.type
        ),
      {
        message: "File must be a valid image (JPEG, PNG, GIF) or PDF",
      }
    ),
});

// Admin payment update validation
export const paymentUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(500, "Notes too long").optional(),
});

// Type exports
export type FileValidationInput = z.infer<typeof fileValidationSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type SecurePaymentProofInput = z.infer<typeof securePaymentProofSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;