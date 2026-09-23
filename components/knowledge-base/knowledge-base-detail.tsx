'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { DocumentStatusBadge } from './document-status-badge';
import { KnowledgeSearchPanel } from './knowledge-search-panel';
import {
  createDocument,
  deleteDocument,
  fetchDocuments,
  fetchKnowledgeBase,
  reindexDocument,
} from '@/features/knowledge-base/api';
import { DocumentSource, DocumentStatus } from '@/types/api';

const SOURCE_LABEL: Record<string, string> = {
  [DocumentSource.Text]: 'ข้อความ',
  [DocumentSource.Markdown]: 'Markdown',
  [DocumentSource.Faq]: 'FAQ (คำถาม-คำตอบ)',
  [DocumentSource.Url]: 'เว็บไซต์ (URL)',
};

/** PDF needs a file upload endpoint, which is not built — see docs/API.md §2. */
const SELECTABLE_SOURCES = [
  DocumentSource.Text,
  DocumentSource.Markdown,
  DocumentSource.Faq,
  DocumentSource.Url,
];

export function KnowledgeBaseDetail({ knowledgeBaseId }: { knowledgeBaseId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<DocumentSource>(DocumentSource.Text);
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const kbQuery = useQuery({
    queryKey: ['knowledge-bases', knowledgeBaseId],
    queryFn: () => fetchKnowledgeBase(knowledgeBaseId),
  });

  const documentsQuery = useQuery({
    queryKey: ['knowledge-bases', knowledgeBaseId, 'documents'],
    queryFn: () => fetchDocuments(knowledgeBaseId),
    // Ingestion is asynchronous; poll while anything is still in flight so
    // PENDING → READY appears without the admin reloading the page.
    refetchInterval: (query) =>
      query.state.data?.some(
        (doc) =>
          doc.status === DocumentStatus.Pending || doc.status === DocumentStatus.Processing,
      )
        ? 2000
        : false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['knowledge-bases', knowledgeBaseId, 'documents'] });

  const createMutation = useMutation({
    mutationFn: () =>
      createDocument(knowledgeBaseId, {
        title,
        sourceType,
        ...(sourceType === DocumentSource.Url ? { sourceUrl } : { content }),
      }),
    onSuccess: () => {
      void invalidate();
      setTitle('');
      setContent('');
      setSourceUrl('');
      setOpen(false);
      toast.success('เพิ่มเอกสารแล้ว — กำลังประมวลผล');
    },
    onError: () => toast.error('เพิ่มเอกสารไม่สำเร็จ'),
  });

  const reindexMutation = useMutation({
    mutationFn: reindexDocument,
    onSuccess: () => {
      void invalidate();
      toast.success('เริ่ม Re-index แล้ว');
    },
    onError: () => toast.error('Re-index ไม่สำเร็จ'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void invalidate();
      toast.success('ลบเอกสารแล้ว');
    },
    onError: () => toast.error('ลบไม่สำเร็จ'),
  });

  if (kbQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (kbQuery.isError) {
    return <p className="text-destructive text-sm">ไม่พบ Knowledge Base นี้</p>;
  }

  const isUrl = sourceType === DocumentSource.Url;
  const canSubmit = title.trim() && (isUrl ? sourceUrl.trim() : content.trim());

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/knowledge-bases">
            <ArrowLeft className="size-4" />
            <span className="sr-only">กลับ</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{kbQuery.data.name}</h1>
          <p className="text-muted-foreground text-sm">
            {kbQuery.data.description ?? 'ไม่มีคำอธิบาย'}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              เพิ่มเอกสาร
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มเอกสาร</DialogTitle>
              <DialogDescription>
                เนื้อหาจะถูกแบ่งเป็นส่วนย่อยและทำ index อัตโนมัติ
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="doc-title">ชื่อเอกสาร</Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น นโยบายการคืนสินค้า"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="doc-source">ประเภท</Label>
                <Select
                  id="doc-source"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as DocumentSource)}
                >
                  {SELECTABLE_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {SOURCE_LABEL[source]}
                    </option>
                  ))}
                </Select>
              </div>

              {isUrl ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="doc-url">URL</Label>
                  <Input
                    id="doc-url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/policy"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="doc-content">เนื้อหา</Label>
                  <Textarea
                    id="doc-content"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      sourceType === DocumentSource.Faq
                        ? 'Q: รับประกันกี่ปี\nA: รับประกัน 1 ปีเต็ม'
                        : 'ลูกค้าสามารถขอคืนสินค้าได้ภายใน 7 วัน...'
                    }
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
                เพิ่ม
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เอกสาร</CardTitle>
          <CardDescription>
            AI จะตอบจากเอกสารที่สถานะ &quot;พร้อมใช้&quot; เท่านั้น
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {documentsQuery.isPending && <Skeleton className="h-16 w-full" />}

          {documentsQuery.isSuccess && documentsQuery.data.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              ยังไม่มีเอกสาร — เพิ่มเอกสารเพื่อให้ AI ตอบคำถามจากข้อมูลจริง
            </p>
          )}

          {documentsQuery.data?.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 rounded-md border p-3">
              <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{doc.title}</span>
                  <DocumentStatusBadge status={doc.status} />
                  <span className="text-muted-foreground text-[11px]">
                    {SOURCE_LABEL[doc.sourceType] ?? doc.sourceType}
                    {doc.status === DocumentStatus.Ready && ` · ${doc.chunkCount} ส่วน`}
                  </span>
                </div>

                {doc.errorMessage && (
                  <p className="text-destructive mt-1 text-xs">{doc.errorMessage}</p>
                )}

                {doc.sourceUrl && (
                  <p className="text-muted-foreground mt-1 truncate text-[11px]">{doc.sourceUrl}</p>
                )}
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => reindexMutation.mutate(doc.id)}
                  disabled={reindexMutation.isPending || doc.status === DocumentStatus.Processing}
                  title="Re-index"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="sr-only">Re-index</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  title="ลบ"
                >
                  <Trash2 className="text-destructive size-3.5" />
                  <span className="sr-only">ลบ</span>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <KnowledgeSearchPanel knowledgeBaseId={knowledgeBaseId} />
    </div>
  );
}
