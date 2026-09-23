'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as motion from 'motion/react-client';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { searchKnowledge } from '@/features/knowledge-base/api';

/**
 * Retrieval debugger.
 *
 * Shows raw distances *without* thresholding. When someone says "the AI
 * doesn't know our refund policy", this separates the two very different
 * causes: the chunk was never retrieved, or it was retrieved but ranked
 * beyond the relevance cut-off.
 */
export function KnowledgeSearchPanel({ knowledgeBaseId }: { knowledgeBaseId: string }) {
  const [query, setQuery] = useState('');

  const searchMutation = useMutation({
    mutationFn: () => searchKnowledge(knowledgeBaseId, query),
  });

  const result = searchMutation.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4" />
          ทดสอบการค้นหา
        </CardTitle>
        <CardDescription>
          ดูว่าคำถามหนึ่ง ๆ ดึงเอกสารไหนขึ้นมา และระยะห่างเท่าไหร่ — ใช้หาสาเหตุเวลา AI ตอบไม่ตรง
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) searchMutation.mutate();
          }}
          className="flex gap-2"
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="เช่น คืนสินค้าได้ภายในกี่วัน"
            aria-label="คำค้นหา"
          />
          <Button type="submit" variant="outline" disabled={!query.trim() || searchMutation.isPending}>
            {searchMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'ค้นหา'}
          </Button>
        </form>

        {searchMutation.isError && (
          <p className="text-destructive text-sm">ค้นหาไม่สำเร็จ</p>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              เกณฑ์ความเกี่ยวข้อง: ระยะห่าง ≤ {result.maxDistance.toFixed(2)}
            </p>

            {result.chunks.length === 0 && (
              <p className="text-muted-foreground text-sm">ไม่พบเอกสารใน Knowledge Base นี้</p>
            )}

            {result.chunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`rounded-md border p-3 ${chunk.relevant ? '' : 'opacity-55'}`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={chunk.relevant ? 'default' : 'outline'} className="text-[10px]">
                    {chunk.relevant ? 'เกี่ยวข้อง' : 'ไม่ผ่านเกณฑ์'}
                  </Badge>
                  <span className="text-xs font-medium">{chunk.documentTitle}</span>
                  <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                    d={chunk.distance.toFixed(3)}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-3 text-xs">{chunk.content}</p>
              </div>
            ))}

            {result.chunks.length > 0 && !result.chunks.some((c) => c.relevant) && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ไม่มีเอกสารผ่านเกณฑ์ — AI จะตอบว่าไม่มีข้อมูลและส่งต่อให้แอดมิน ซึ่งเป็นพฤติกรรมที่ถูกต้อง
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
