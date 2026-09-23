'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import * as motion from 'motion/react-client';
import { Inbox, Users, Bot, BookOpen, ArrowRight, Clock, UserRoundCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiEnvelope, Customer, PaginatedEnvelope } from '@/types/api';
import { useAnalyticsOverview } from '@/features/analytics/hooks';
import { formatDuration, formatPercent } from '@/features/analytics/format';

/**
 * Phase 1 dashboard.
 *
 * Still deliberately minimal (master plan §36: "MVP Dashboard ไม่ต้องซับซ้อน").
 * Phase 7 added the three headline metrics below, which every role can see —
 * they are gated on `conversation.read`. Cost lives on /analytics instead,
 * behind `settings.read`, so it stays out of an AGENT's landing page.
 */
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1 }],
    queryFn: () => apiClient.get<PaginatedEnvelope<Customer>>('/admin/customers?page=1&limit=5'),
  });

  const agentsQuery = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => apiClient.get<ApiEnvelope<unknown[]>>('/admin/ai-agents').then((r) => r.data),
  });

  const kbQuery = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () =>
      apiClient.get<ApiEnvelope<unknown[]>>('/admin/knowledge-bases').then((r) => r.data),
  });

  // Replaces the old conversations?limit=1 call: the overview already
  // carries the total, so the dashboard makes one request instead of two and
  // the tile agrees with the analytics page by construction.
  const overviewQuery = useAnalyticsOverview(30);

  const tiles = [
    {
      icon: Users,
      label: 'ลูกค้า',
      value: customersQuery.isPending ? '—' : String(customersQuery.data?.meta.total ?? 0),
      ready: true,
      href: null,
    },
    {
      icon: Inbox,
      label: 'การสนทนา',
      value: overviewQuery.isPending
        ? '—'
        : String(overviewQuery.data?.conversations.total ?? 0),
      ready: true,
      href: '/inbox' as const,
    },
    {
      icon: Bot,
      label: 'AI Agent',
      value: agentsQuery.isPending ? '—' : String(agentsQuery.data?.length ?? 0),
      ready: true,
      href: '/ai-agents' as const,
    },
    {
      icon: BookOpen,
      label: 'Knowledge Base',
      value: kbQuery.isPending ? '—' : String(kbQuery.data?.length ?? 0),
      ready: true,
      href: '/knowledge-bases' as const,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          สวัสดี{user ? `, ${user.name}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm">ภาพรวมระบบ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
          >
            {tile.href ? (
              <Link href={tile.href} className="block">
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <tile.icon className="text-muted-foreground size-4" />
                    <CardDescription>{tile.label}</CardDescription>
                    <CardTitle className="text-2xl">{tile.value}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <Card className={tile.ready ? '' : 'opacity-60'}>
                <CardHeader>
                  <tile.icon className="text-muted-foreground size-4" />
                  <CardDescription>{tile.label}</CardDescription>
                  <CardTitle className="text-2xl">{tile.value}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      <Link href="/analytics" className="block">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">ประสิทธิภาพ AI (30 วันล่าสุด)</CardTitle>
                <CardDescription>ดูรายงานฉบับเต็ม</CardDescription>
              </div>
              <ArrowRight className="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Bot,
                  label: 'AI แก้ปัญหาได้เอง',
                  value: formatPercent(overviewQuery.data?.rates.aiResolution ?? null),
                  hint:
                    overviewQuery.data && overviewQuery.data.rates.aiResolutionSampled === 0
                      ? 'ยังไม่มีบทสนทนาที่ปิด'
                      : undefined,
                },
                {
                  icon: UserRoundCheck,
                  label: 'ส่งต่อเจ้าหน้าที่',
                  value: formatPercent(overviewQuery.data?.rates.handoff ?? null),
                },
                {
                  icon: Clock,
                  label: 'ตอบกลับเฉลี่ย',
                  value: formatDuration(overviewQuery.data?.responseTime.averageSeconds ?? null),
                },
              ].map((metric) => (
                <div key={metric.label} className="flex items-start gap-2.5">
                  <metric.icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground truncate text-xs">{metric.label}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {overviewQuery.isPending ? '—' : metric.value}
                    </p>
                    {metric.hint && !overviewQuery.isPending && (
                      <p className="text-muted-foreground text-[11px] leading-tight">
                        {metric.hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ลูกค้าล่าสุด</CardTitle>
          <CardDescription>
            ข้อมูลนี้ดึงผ่าน API ที่ตรวจสอบสิทธิ์และ Organization แล้ว
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customersQuery.isPending && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          )}

          {customersQuery.isError && (
            <p className="text-destructive text-sm">ไม่สามารถโหลดข้อมูลลูกค้าได้</p>
          )}

          {customersQuery.isSuccess && customersQuery.data.data.length === 0 && (
            <p className="text-muted-foreground text-sm">ยังไม่มีลูกค้าในระบบ</p>
          )}

          {customersQuery.isSuccess && customersQuery.data.data.length > 0 && (
            <ul className="divide-y">
              {customersQuery.data.data.map((customer) => (
                <li key={customer.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{customer.name ?? 'ไม่ระบุชื่อ'}</p>
                    <p className="text-muted-foreground text-xs">
                      {customer.email ?? customer.phone ?? '—'}
                    </p>
                  </div>
                  {customer.tags.length > 0 && (
                    <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                      {customer.tags[0]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
