'use client';

import { Mail, Phone, Tag, StickyNote, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConversationDetail } from '@/types/api';

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px]">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  );
}

export function CustomerPanel({
  conversation,
  loading,
}: {
  conversation?: ConversationDetail;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  const customer = conversation?.customer;

  if (!customer) {
    return <p className="text-muted-foreground p-4 text-sm">ไม่มีข้อมูลลูกค้า</p>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar className="size-14">
          <AvatarFallback className="text-base">
            {(customer.name ?? '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{customer.name ?? 'ไม่ระบุชื่อ'}</p>
          <p className="text-muted-foreground text-xs">ลูกค้า</p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <Row icon={Mail} label="อีเมล" value={customer.email ?? '—'} />
        <Row icon={Phone} label="เบอร์โทร" value={customer.phone ?? '—'} />
        <Row
          icon={Clock}
          label="ลูกค้าตั้งแต่"
          value={new Date(customer.createdAt).toLocaleDateString('th-TH')}
        />
      </div>

      {customer.tags.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <Tag className="size-3" /> แท็ก
            </p>
            <div className="flex flex-wrap gap-1">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {customer.notes && (
        <>
          <Separator />
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <StickyNote className="size-3" /> บันทึก
            </p>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
