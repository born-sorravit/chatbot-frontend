'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelCard } from './channel-card';
import { CHANNEL_CATALOG } from '@/features/channels/catalog';
import { useChannels } from '@/features/channels/hooks';

export function ChannelsView() {
  const { data, isPending, isError, canRead } = useChannels();

  if (!canRead) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardContent className="text-muted-foreground p-6 text-center text-sm">
            คุณไม่มีสิทธิ์เข้าถึงการตั้งค่าช่องทาง — ต้องใช้สิทธิ์ระดับผู้ดูแลระบบ
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">ช่องทางการติดต่อ</h1>
        <p className="text-muted-foreground text-sm">
          เชื่อมต่อ LINE, Facebook หรือ WhatsApp — ข้อความจะเข้ากล่องเดียวกัน และ AI ตอบให้เหมือนกับเว็บแชท
        </p>
      </header>

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="text-destructive p-4 text-sm">
            โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </CardContent>
        </Card>
      )}

      {isPending ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {CHANNEL_CATALOG.map((spec, index) => (
            <ChannelCard
              key={spec.channel}
              spec={spec}
              index={index}
              integration={data?.find((row) => row.channel === spec.channel)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
