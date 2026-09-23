import { z } from 'zod';

/**
 * Mirrors LoginDto in chatbots-backend/src/modules/auth/dto/login.dto.ts.
 * Client-side validation is UX only — the server validates independently.
 */
export const loginSchema = z.object({
  email: z.email({ message: 'กรุณากรอกอีเมลให้ถูกต้อง' }),
  password: z.string().min(8, { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
