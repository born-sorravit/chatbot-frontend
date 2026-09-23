'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as motion from 'motion/react-client';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testAgent } from '@/features/ai-agents/api';
import { AIResponseState } from '@/types/api';
import { ApiError } from '@/lib/api-error';

const STATE_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  [AIResponseState.Answered]: { label: 'ตอบได้', variant: 'default' },
  [AIResponseState.NeedMoreInformation]: { label: 'ขอข้อมูลเพิ่ม', variant: 'secondary' },
  [AIResponseState.ToolRequired]: { label: 'ต้องใช้ Tool', variant: 'secondary' },
  [AIResponseState.Handoff]: { label: 'ส่งต่อแอดมิน', variant: 'destructive' },
};

/**
 * Dry run against the live prompt and provider.
 *
 * Creates no conversation and notifies nobody — it exists so a prompt change
 * can be checked before customers meet it.
 */
export function AgentTestPanel({ agentId }: { agentId: string }) {
  const [message, setMessage] = useState('คืนสินค้าได้ภายในกี่วันครับ');

  const testMutation = useMutation({
    mutationFn: () => testAgent(agentId, message),
  });

  const result = testMutation.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="size-4" />
          ทดสอบ
        </CardTitle>
        <CardDescription>
          ลองส่งข้อความหา AI ด้วยการตั้งค่าปัจจุบัน โดยไม่สร้างการสนทนาจริง
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          maxLength={4000}
          aria-label="ข้อความทดสอบ"
          className="resize-none"
        />

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={!message.trim() || testMutation.isPending}
          >
            {testMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            ทดสอบ
          </Button>
        </div>

        {testMutation.isError && (
          <p className="text-destructive text-sm">
            {testMutation.error instanceof ApiError &&
            testMutation.error.code === 'RATE_LIMIT_EXCEEDED'
              ? 'ทดสอบบ่อยเกินไป กรุณารอสักครู่'
              : 'ทดสอบไม่สำเร็จ'}
          </p>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              {result.state && (
                <Badge variant={STATE_LABEL[result.state]?.variant ?? 'secondary'}>
                  {STATE_LABEL[result.state]?.label ?? result.state}
                </Badge>
              )}
              <Badge variant="outline" className="font-mono text-[10px]">
                {result.model}
              </Badge>
              {result.provider === 'stub' && (
                <Badge variant="outline" className="text-[10px]">
                  stub provider
                </Badge>
              )}
            </div>

            {result.message ? (
              <p className="text-sm whitespace-pre-wrap">{result.message}</p>
            ) : (
              <p className="text-destructive text-sm">{result.error ?? 'ไม่มีคำตอบ'}</p>
            )}

            {result.retrieval && (
              <div className="flex flex-col gap-1.5 rounded-md border p-2.5">
                <p className="text-muted-foreground text-[11px]">
                  ค้นจาก Knowledge Base — เกณฑ์ ≤ {result.retrieval.maxDistance.toFixed(2)}
                </p>
                {result.retrieval.chunks.length === 0 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ไม่พบข้อมูลที่เกี่ยวข้อง — AI จะบอกว่าไม่มีข้อมูลและส่งต่อ (ถูกต้องตามนโยบาย)
                  </p>
                ) : (
                  result.retrieval.chunks.map((chunk, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">{chunk.documentTitle}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-[10px]">
                        d={chunk.distance.toFixed(3)}
                      </span>
                      <p className="text-muted-foreground line-clamp-2">{chunk.preview}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <dl className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt>เวลา</dt>
                <dd className="text-foreground">{result.latencyMs} ms</dd>
              </div>
              <div>
                <dt>Tokens</dt>
                <dd className="text-foreground">{result.usage.totalTokens}</dd>
              </div>
              <div>
                <dt>ค่าใช้จ่ายโดยประมาณ</dt>
                <dd className="text-foreground">${result.estimatedCostUsd.toFixed(6)}</dd>
              </div>
            </dl>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
