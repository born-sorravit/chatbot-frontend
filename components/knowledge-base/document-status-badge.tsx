'use client';

import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DocumentStatus } from '@/types/api';

const STATUS: Record<
  DocumentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }
> = {
  [DocumentStatus.Pending]: { label: 'รอประมวลผล', variant: 'outline', icon: Clock },
  [DocumentStatus.Processing]: { label: 'กำลังประมวลผล', variant: 'secondary', icon: Loader2 },
  [DocumentStatus.Ready]: { label: 'พร้อมใช้', variant: 'default', icon: CheckCircle2 },
  [DocumentStatus.Failed]: { label: 'ล้มเหลว', variant: 'destructive', icon: AlertCircle },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS[status] ?? STATUS[DocumentStatus.Pending];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 text-[10px]">
      <Icon className={`size-2.5 ${status === DocumentStatus.Processing ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
