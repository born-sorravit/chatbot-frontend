'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as motion from 'motion/react-client';
import { AlertCircle, Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginInput } from '@/features/auth/schema';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api-error';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Branch on code, never on the message string.
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      case 'RATE_LIMIT_EXCEEDED':
        return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
      case 'VALIDATION_FAILED':
        return 'ข้อมูลที่กรอกไม่ถูกต้อง';
      default:
        return 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    }
  }
  return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
}

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // An already-authenticated admin who lands on /login goes straight through.
  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace('/dashboard');
    }
  }, [hydrated, accessToken, router]);

  return (
    <main className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardHeader className="items-center text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-11 items-center justify-center rounded-xl">
              <MessageSquareText className="size-5" />
            </div>
            <CardTitle className="text-xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription>AI Customer Support — Admin</CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@acme.com"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password.message}</p>
                )}
              </div>

              {loginMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-sm"
                  role="alert"
                  data-testid="login-error"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage(loginMutation.error)}</span>
                </motion.div>
              )}

              <Button type="submit" className="mt-1 w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {loginMutation.isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
