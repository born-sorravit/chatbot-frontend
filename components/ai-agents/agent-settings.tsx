'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Info, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAgent, updateAgent } from '@/features/ai-agents/api';
import { fetchKnowledgeBases } from '@/features/knowledge-base/api';
import { fetchTools } from '@/features/tools/api';
import { ToolExecutionList } from '@/components/tools/tool-execution-list';
import { Badge } from '@/components/ui/badge';
import { agentFormSchema, type AgentFormValues } from '@/features/ai-agents/schema';
import { AI_EFFORT_LEVELS, AI_TONES, ALLOWED_LLM_MODELS } from '@/types/api';
import { ApiError } from '@/lib/api-error';
import { AgentTestPanel } from './agent-test-panel';

const TONE_LABEL: Record<string, string> = {
  friendly: 'เป็นกันเอง',
  professional: 'มืออาชีพ',
  casual: 'สบาย ๆ',
  formal: 'ทางการ',
};

const EFFORT_HELP =
  'ควบคุมความลึกในการคิดของโมเดล — สูงขึ้นหมายถึงคำตอบดีขึ้นแต่ช้าและแพงขึ้น';

export function AgentSettings({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();

  const agentQuery = useQuery({
    queryKey: ['ai-agents', agentId],
    queryFn: () => fetchAgent(agentId),
  });

  const knowledgeBasesQuery = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: fetchKnowledgeBases,
  });

  const toolsQuery = useQuery({ queryKey: ['tools'], queryFn: fetchTools });

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
  });

  const { register, handleSubmit, reset, formState } = form;

  // Populated once the agent loads; `reset` also clears the dirty state so
  // the save button reflects real edits rather than the initial fill.
  useEffect(() => {
    if (agentQuery.data) {
      const agent = agentQuery.data;
      reset({
        name: agent.name,
        description: agent.description ?? '',
        systemPrompt: agent.systemPrompt,
        language: agent.language,
        tone: agent.tone as AgentFormValues['tone'],
        model: agent.model as AgentFormValues['model'],
        effort: agent.effort as AgentFormValues['effort'],
        maxTokens: agent.maxTokens,
        maxContextMessages: agent.maxContextMessages,
        autoReply: agent.autoReply,
        handoffEnabled: agent.handoffEnabled,
        ragEnabled: agent.ragEnabled,
        knowledgeBaseIds: agent.knowledgeBaseIds ?? [],
        toolIds: agent.toolIds ?? [],
      });
    }
  }, [agentQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: AgentFormValues) => updateAgent(agentId, values),
    onSuccess: (agent) => {
      queryClient.setQueryData(['ai-agents', agentId], agent);
      void queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      reset(undefined, { keepValues: true });
      toast.success('บันทึกการตั้งค่าแล้ว');
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.code === 'VALIDATION_FAILED'
          ? 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
          : 'บันทึกไม่สำเร็จ',
      );
    },
  });

  if (agentQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (agentQuery.isError) {
    return <p className="text-destructive text-sm">ไม่พบ AI Agent นี้</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ai-agents">
            <ArrowLeft className="size-4" />
            <span className="sr-only">กลับ</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{agentQuery.data.name}</h1>
          <p className="text-muted-foreground text-sm">ตั้งค่า AI Agent</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">ชื่อ</Label>
              <Input id="name" {...register('name')} />
              {formState.errors.name && (
                <p className="text-destructive text-sm">{formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Input id="description" {...register('description')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Prompt</CardTitle>
            <CardDescription>
              กฎที่ AI ต้องปฏิบัติตาม — ส่วนที่ห้ามแต่งข้อมูลเองอยู่ในนี้ แก้ด้วยความระมัดระวัง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="systemPrompt"
              rows={16}
              className="font-mono text-xs"
              {...register('systemPrompt')}
              aria-label="System prompt"
            />
            {formState.errors.systemPrompt && (
              <p className="text-destructive mt-2 text-sm">
                {formState.errors.systemPrompt.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">โมเดลและการตอบ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">โมเดล</Label>
              <Select id="model" {...register('model')}>
                {ALLOWED_LLM_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="effort">Effort</Label>
              <Select id="effort" {...register('effort')}>
                {AI_EFFORT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
              <p className="text-muted-foreground text-xs">{EFFORT_HELP}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language">ภาษา</Label>
              <Input id="language" maxLength={10} {...register('language')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tone">โทนการพูด</Label>
              <Select id="tone" {...register('tone')}>
                {AI_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {TONE_LABEL[tone] ?? tone}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="maxTokens">Max tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={256}
                max={8192}
                {...register('maxTokens', { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="maxContextMessages">จำนวนข้อความย้อนหลังที่ส่งให้ AI</Label>
              <Input
                id="maxContextMessages"
                type="number"
                min={1}
                max={100}
                {...register('maxContextMessages', { valueAsNumber: true })}
              />
              <p className="text-muted-foreground text-xs">
                ยิ่งมากยิ่งเข้าใจบริบทดีขึ้น แต่ค่าใช้จ่ายสูงขึ้นตาม
              </p>
            </div>

            <div className="text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-md p-3 text-xs sm:col-span-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                ไม่มีค่า <code className="font-mono">temperature</code> ให้ตั้ง —
                โมเดล Claude รุ่นปัจจุบันปฏิเสธพารามิเตอร์ sampling (ตอบกลับ 400)
                ใช้ <strong>Effort</strong> แทนในการควบคุมความลึกของคำตอบ
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">พฤติกรรม</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="autoReply">ตอบอัตโนมัติ</Label>
                <p className="text-muted-foreground text-xs">
                  ปิดไว้เพื่อให้ทุกการสนทนารอแอดมินตอบเอง
                </p>
              </div>
              <Switch id="autoReply" {...register('autoReply')} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="handoffEnabled">ส่งต่อให้แอดมิน</Label>
                <p className="text-muted-foreground text-xs">
                  ให้ AI ส่งต่อเมื่อไม่สามารถตอบได้อย่างปลอดภัย
                </p>
              </div>
              <Switch id="handoffEnabled" {...register('handoffEnabled')} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="ragEnabled">ค้นหาจาก Knowledge Base</Label>
                <p className="text-muted-foreground text-xs">
                  ปิดไว้เพื่อให้ AI ตอบโดยไม่ค้นข้อมูลธุรกิจ
                </p>
              </div>
              <Switch id="ragEnabled" {...register('ragEnabled')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Base</CardTitle>
            <CardDescription>
              AI จะค้นหาคำตอบจากเฉพาะ Knowledge Base ที่เลือกไว้เท่านั้น — ถ้าไม่เลือกเลย
              AI จะไม่มีข้อมูลธุรกิจและจะส่งต่อให้แอดมินแทนการเดา
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {knowledgeBasesQuery.isPending && <Skeleton className="h-10 w-full" />}

            {knowledgeBasesQuery.isSuccess && knowledgeBasesQuery.data.length === 0 && (
              <p className="text-muted-foreground text-sm">
                ยังไม่มี Knowledge Base —{' '}
                <Link href="/knowledge-bases" className="text-primary underline">
                  สร้างก่อน
                </Link>
              </p>
            )}

            {knowledgeBasesQuery.data?.map((kb) => (
              <label
                key={kb.id}
                className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors"
              >
                <input
                  type="checkbox"
                  value={kb.id}
                  className="size-4 accent-current"
                  {...register('knowledgeBaseIds')}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{kb.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {kb.description ?? 'ไม่มีคำอธิบาย'}
                  </p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tools</CardTitle>
            <CardDescription>
              AI เรียกได้เฉพาะ Tool ที่ติ๊กไว้เท่านั้น — Tool ที่ไม่ได้ติ๊กจะถูกปฏิเสธและบันทึกไว้
              แม้ AI จะพยายามเรียกก็ตาม
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {toolsQuery.isPending && <Skeleton className="h-10 w-full" />}

            {toolsQuery.isSuccess && toolsQuery.data.length === 0 && (
              <p className="text-muted-foreground text-sm">ยังไม่มี Tool ในระบบ</p>
            )}

            {toolsQuery.data?.map((tool) => (
              <label
                key={tool.id}
                className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <input
                  type="checkbox"
                  value={tool.id}
                  className="mt-0.5 size-4 accent-current"
                  {...register('toolIds')}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-sm">
                    {tool.name}
                    {tool.mutating && (
                      <Badge variant="destructive" className="text-[10px]">
                        เปลี่ยนแปลงข้อมูล — ต้องอนุมัติ
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">{tool.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saveMutation.isPending || !formState.isDirty}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึก
          </Button>
          {formState.isDirty && (
            <span className="text-muted-foreground text-xs">มีการแก้ไขที่ยังไม่บันทึก</span>
          )}
        </div>
      </form>

      <AgentTestPanel agentId={agentId} />

      <ToolExecutionList />
    </div>
  );
}
