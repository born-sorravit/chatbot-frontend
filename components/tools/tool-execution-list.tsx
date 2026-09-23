'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, TerminalSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  approveToolExecution,
  fetchToolExecutions,
  rejectToolExecution,
} from '@/features/tools/api';
import { ToolExecutionStatus } from '@/types/api';

const STATUS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [ToolExecutionStatus.Success]: { label: 'สำเร็จ', variant: 'default' },
  [ToolExecutionStatus.Failed]: { label: 'ล้มเหลว', variant: 'destructive' },
  [ToolExecutionStatus.Rejected]: { label: 'ถูกปฏิเสธ', variant: 'destructive' },
  [ToolExecutionStatus.PendingApproval]: { label: 'รออนุมัติ', variant: 'secondary' },
  [ToolExecutionStatus.Approved]: { label: 'อนุมัติแล้ว', variant: 'outline' },
  [ToolExecutionStatus.Running]: { label: 'กำลังทำงาน', variant: 'outline' },
};

/**
 * Tool execution log (master plan §25).
 *
 * Shows rejections and validation failures alongside successes — "the AI
 * tried to call something it was not allowed to" is the entry an operator
 * most needs to be able to find.
 */
export function ToolExecutionList() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tool-executions'],
    queryFn: () => fetchToolExecutions(),
    refetchInterval: 15_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tool-executions'] });

  const approveMutation = useMutation({
    mutationFn: approveToolExecution,
    onSuccess: () => {
      void invalidate();
      toast.success('อนุมัติแล้ว');
    },
    onError: () => toast.error('อนุมัติไม่สำเร็จ'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectToolExecution(id),
    onSuccess: () => {
      void invalidate();
      toast.success('ปฏิเสธแล้ว');
    },
    onError: () => toast.error('ปฏิเสธไม่สำเร็จ'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TerminalSquare className="size-4" />
          ประวัติการเรียก Tool
        </CardTitle>
        <CardDescription>
          บันทึกทุกครั้งที่ AI เรียกใช้ Tool รวมถึงครั้งที่ถูกปฏิเสธ
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {query.isPending && <Skeleton className="h-16 w-full" />}

        {query.isSuccess && query.data.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">ยังไม่มีการเรียก Tool</p>
        )}

        {query.data?.map((execution) => {
          const status = STATUS[execution.status] ?? {
            label: execution.status,
            variant: 'outline' as const,
          };
          const pending = execution.status === ToolExecutionStatus.PendingApproval;

          return (
            <div key={execution.id} className="flex items-start gap-3 rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs font-medium">{execution.toolName}</code>
                  <Badge variant={status.variant} className="text-[10px]">
                    {status.label}
                  </Badge>
                  {execution.durationMs !== null && (
                    <span className="text-muted-foreground text-[10px]">
                      {execution.durationMs}ms
                    </span>
                  )}
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    {new Date(execution.createdAt).toLocaleString('th-TH')}
                  </span>
                </div>

                <p className="text-muted-foreground mt-1 truncate font-mono text-[11px]">
                  in: {JSON.stringify(execution.input)}
                </p>

                {execution.output && (
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    out: {JSON.stringify(execution.output)}
                  </p>
                )}

                {execution.errorMessage && (
                  <p className="text-destructive mt-1 text-xs">{execution.errorMessage}</p>
                )}
              </div>

              {pending && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => approveMutation.mutate(execution.id)}
                    disabled={approveMutation.isPending}
                    title="อนุมัติ"
                  >
                    <Check className="size-3.5 text-green-600" />
                    <span className="sr-only">อนุมัติ</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => rejectMutation.mutate(execution.id)}
                    disabled={rejectMutation.isPending}
                    title="ปฏิเสธ"
                  >
                    <X className="text-destructive size-3.5" />
                    <span className="sr-only">ปฏิเสธ</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
