'use client';

import { useState } from 'react';
import {
  Bot,
  CircleDollarSign,
  Clock,
  Coins,
  Hourglass,
  Inbox,
  MessageSquare,
  UserRoundCheck,
  Wrench,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './stat-card';
import { DailyChart } from './daily-chart';
import { BreakdownBars } from './breakdown-bars';
import { useAiUsage, useAnalyticsOverview } from '@/features/analytics/hooks';
import {
  EMPTY,
  HANDOFF_REASON_LABEL,
  formatCount,
  formatDecimal,
  formatDuration,
  formatMs,
  formatPercent,
  formatTokens,
  formatUsd,
} from '@/features/analytics/format';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, label: '7 วัน' },
  { days: 30, label: '30 วัน' },
  { days: 90, label: '90 วัน' },
] as const;

export function AnalyticsView() {
  const [days, setDays] = useState<number>(30);

  const overview = useAnalyticsOverview(days);
  const usage = useAiUsage(days);

  const o = overview.data;
  const u = usage.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">รายงานและสถิติ</h1>
          <p className="text-muted-foreground text-sm">
            ภาพรวมการสนทนา ประสิทธิภาพของ AI และการใช้งาน
          </p>
        </div>

        <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              className={cn(
                'rounded-md px-3 py-1 text-sm transition-colors',
                days === range.days
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </header>

      {overview.isError && (
        <Card className="border-destructive/40">
          <CardContent className="text-destructive p-4 text-sm">
            โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </CardContent>
        </Card>
      )}

      {/* ── Conversation volume ─────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          icon={Inbox}
          label="การสนทนาทั้งหมด"
          loading={overview.isPending}
          value={formatCount(o?.conversations.total ?? null)}
          hint={
            o ? `เปิดอยู่ ${o.conversations.open} · ปิดแล้ว ${o.conversations.closed}` : undefined
          }
        />
        <StatCard
          index={1}
          icon={Bot}
          label="AI แก้ปัญหาได้เอง"
          loading={overview.isPending}
          value={formatPercent(o?.rates.aiResolution ?? null)}
          accent="positive"
          // The sample size is part of the number, not a footnote: a 100%
          // resolution rate over one conversation is not the same claim as
          // 100% over two hundred, and the card should not let it look like it.
          hint={
            o
              ? o.rates.aiResolutionSampled > 0
                ? `จาก ${o.rates.aiResolutionSampled} บทสนทนาที่ปิดแล้ว`
                : 'ยังไม่มีบทสนทนาที่ปิด'
              : undefined
          }
        />
        <StatCard
          index={2}
          icon={UserRoundCheck}
          label="ส่งต่อให้เจ้าหน้าที่"
          loading={overview.isPending}
          value={formatPercent(o?.rates.handoff ?? null)}
          accent="warning"
          hint={o ? `${o.conversations.handedOff} จาก ${o.conversations.total} บทสนทนา` : undefined}
        />
        <StatCard
          index={3}
          icon={Clock}
          label="เวลาตอบกลับเฉลี่ย"
          loading={overview.isPending}
          value={formatDuration(o?.responseTime.averageSeconds ?? null)}
          hint={
            o
              ? o.responseTime.sampled > 0
                ? `มัธยฐาน ${formatDuration(o.responseTime.medianSeconds)} · ${o.responseTime.sampled} ครั้ง`
                : 'ยังไม่มีข้อความที่ถูกตอบกลับ'
              : undefined
          }
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          icon={MessageSquare}
          label="ข้อความทั้งหมด"
          loading={overview.isPending}
          value={formatCount(o?.messages.total ?? null)}
          hint={
            o
              ? `ลูกค้า ${o.messages.fromCustomer} · AI ${o.messages.fromAi} · เจ้าหน้าที่ ${o.messages.fromAdmin}`
              : undefined
          }
        />
        <StatCard
          index={1}
          icon={MessageSquare}
          label="ข้อความต่อบทสนทนา"
          loading={overview.isPending}
          value={formatDecimal(o?.messages.perConversation ?? null)}
        />
        <StatCard
          index={2}
          icon={Hourglass}
          label="ระยะเวลาสนทนาเฉลี่ย"
          loading={overview.isPending}
          value={formatDuration(o?.conversationDuration.averageSeconds ?? null)}
          hint={
            o
              ? o.conversationDuration.sampled > 0
                ? `จาก ${o.conversationDuration.sampled} บทสนทนาที่ปิดแล้ว`
                : 'นับเฉพาะบทสนทนาที่ปิดแล้ว'
              : undefined
          }
        />
        <StatCard
          index={3}
          icon={Bot}
          label="โหมดการสนทนา"
          loading={overview.isPending}
          value={o ? `${o.conversations.aiMode} / ${o.conversations.humanMode}` : EMPTY}
          hint="AI / เจ้าหน้าที่"
        />
      </section>

      {/* ── Handoff reasons ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">เหตุผลที่ส่งต่อให้เจ้าหน้าที่</CardTitle>
          <CardDescription>ชี้ว่าควรเพิ่ม Knowledge Base หรือปรับ Prompt ตรงไหน</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.isPending ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <BreakdownBars
              empty="ยังไม่มีการส่งต่อในช่วงเวลานี้"
              rows={(o?.handoffReasons ?? []).map((row) => ({
                label: HANDOFF_REASON_LABEL[row.reason] ?? row.reason,
                value: row.count,
                note: `${row.count} ครั้ง`,
              }))}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Cost: ADMIN/OWNER only ──────────────────────────────────── */}
      {usage.canReadCost && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              index={0}
              icon={Zap}
              label="คำขอไปยัง AI"
              loading={usage.isPending}
              value={formatCount(u?.totals.requests ?? null)}
              hint={u ? `สำเร็จ ${u.totals.succeeded} · ล้มเหลว ${u.totals.failed}` : undefined}
            />
            <StatCard
              index={1}
              icon={Coins}
              label="Token ที่ใช้"
              loading={usage.isPending}
              value={formatTokens(u?.totals.totalTokens ?? null)}
              hint={
                u
                  ? `เข้า ${formatTokens(u.totals.inputTokens)} · ออก ${formatTokens(u.totals.outputTokens)}`
                  : undefined
              }
            />
            <StatCard
              index={2}
              icon={CircleDollarSign}
              label="ค่าใช้จ่ายโดยประมาณ"
              loading={usage.isPending}
              value={formatUsd(u?.totals.estimatedCostUsd ?? null)}
              hint="ประมาณการจากราคาต่อ Token"
            />
            <StatCard
              index={3}
              icon={Clock}
              label="เวลาตอบของโมเดล"
              loading={usage.isPending}
              value={formatMs(u?.totals.averageLatencyMs ?? null)}
              hint={u ? `p95 ${formatMs(u.totals.p95LatencyMs)}` : undefined}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">การใช้งานรายวัน</CardTitle>
                <CardDescription>จำนวนคำขอไปยังโมเดลในแต่ละวัน</CardDescription>
              </CardHeader>
              <CardContent>
                {usage.isPending ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <DailyChart
                    label="คำขอ"
                    format={(value) => `${value} คำขอ`}
                    points={(u?.daily ?? []).map((d) => ({
                      date: d.date.slice(5),
                      value: d.requests,
                      secondary: `${formatTokens(d.totalTokens)} tokens · ${formatUsd(d.estimatedCostUsd)}`,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">แยกตามโมเดล</CardTitle>
                <CardDescription>ค่าใช้จ่ายต่อโมเดล</CardDescription>
              </CardHeader>
              <CardContent>
                {usage.isPending ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <BreakdownBars
                    empty="ยังไม่มีการเรียกใช้โมเดล"
                    rows={(u?.byModel ?? []).map((row) => ({
                      label: row.model,
                      value: row.totalTokens,
                      note: formatUsd(row.estimatedCostUsd),
                    }))}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="size-4" />
                การเรียกใช้เครื่องมือ
              </CardTitle>
              <CardDescription>
                {u
                  ? `ทั้งหมด ${u.tools.executions} ครั้ง · สำเร็จ ${u.tools.succeeded} · ปฏิเสธ ${u.tools.rejected} · ล้มเหลว ${u.tools.failed}`
                  : 'กำลังโหลด'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usage.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <BreakdownBars
                  empty="ยังไม่มีการเรียกใช้เครื่องมือ"
                  rows={(u?.tools.byTool ?? []).map((row) => ({
                    label: row.name,
                    value: row.executions,
                    note: `${row.succeeded}/${row.executions} สำเร็จ`,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
