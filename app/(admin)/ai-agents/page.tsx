'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAgents } from '@/features/ai-agents/api';

export default function AiAgentsPage() {
  const agentsQuery = useQuery({ queryKey: ['ai-agents'], queryFn: fetchAgents });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Agent</h1>
        <p className="text-muted-foreground text-sm">
          ตั้งค่าบุคลิก ข้อความระบบ และโมเดลที่ใช้ตอบลูกค้า
        </p>
      </div>

      {agentsQuery.isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {agentsQuery.isError && (
        <p className="text-destructive text-sm">ไม่สามารถโหลดรายการ AI Agent ได้</p>
      )}

      {agentsQuery.isSuccess && agentsQuery.data.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            ยังไม่มี AI Agent
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {agentsQuery.data?.map((agent) => (
          <Link key={agent.id} href={`/ai-agents/${agent.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary mt-0.5 flex size-8 items-center justify-center rounded-lg">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {agent.name}
                        {agent.isDefault && (
                          <Badge variant="secondary" className="text-[10px]">
                            ค่าเริ่มต้น
                          </Badge>
                        )}
                        {!agent.isActive && (
                          <Badge variant="outline" className="text-[10px]">
                            ปิดใช้งาน
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {agent.description ?? 'ไม่มีคำอธิบาย'} · {agent.model} ·{' '}
                        {agent.autoReply ? 'ตอบอัตโนมัติ' : 'ปิดการตอบอัตโนมัติ'}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
