'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createKnowledgeBase, fetchKnowledgeBases } from '@/features/knowledge-base/api';

export default function KnowledgeBasesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false);

  const query = useQuery({ queryKey: ['knowledge-bases'], queryFn: fetchKnowledgeBases });

  const createMutation = useMutation({
    mutationFn: () => createKnowledgeBase({ name, description: description || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      setName('');
      setDescription('');
      setOpen(false);
      toast.success('สร้าง Knowledge Base แล้ว');
    },
    onError: () => toast.error('สร้างไม่สำเร็จ'),
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm">
            ข้อมูลธุรกิจที่ AI ใช้ตอบลูกค้า — AI จะตอบเฉพาะสิ่งที่อยู่ในนี้เท่านั้น
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              สร้างใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้าง Knowledge Base</DialogTitle>
              <DialogDescription>จัดกลุ่มเอกสาร เช่น นโยบาย สินค้า หรือ FAQ</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="kb-name">ชื่อ</Label>
                <Input
                  id="kb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นโยบายบริษัท"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kb-description">คำอธิบาย</Label>
                <Input
                  id="kb-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!name.trim() || createMutation.isPending}
              >
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {query.isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {query.isError && (
        <p className="text-destructive text-sm">ไม่สามารถโหลด Knowledge Base ได้</p>
      )}

      {query.isSuccess && query.data.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            <BookOpen className="mx-auto mb-2 size-8 opacity-40" />
            <p>ยังไม่มี Knowledge Base</p>
            <p className="text-xs">สร้างแล้วเพิ่มเอกสาร เพื่อให้ AI ตอบคำถามจากข้อมูลจริงได้</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {query.data?.map((kb) => (
          <Link key={kb.id} href={`/knowledge-bases/${kb.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary mt-0.5 flex size-8 items-center justify-center rounded-lg">
                      <BookOpen className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{kb.name}</CardTitle>
                      <CardDescription>{kb.description ?? 'ไม่มีคำอธิบาย'}</CardDescription>
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
