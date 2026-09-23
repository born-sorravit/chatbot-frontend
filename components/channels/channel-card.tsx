'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Link2, Plug, TriangleAlert, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ChannelSpec } from '@/features/channels/catalog';
import { useCreateChannel, useDeleteChannel, useUpdateChannel } from '@/features/channels/hooks';
import type { ChannelIntegration } from '@/types/api';

/** Same source as the API client, so the two can never disagree. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface ChannelCardProps {
  spec: ChannelSpec;
  integration?: ChannelIntegration;
  index: number;
}

export function ChannelCard({ spec, integration, index }: ChannelCardProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(integration?.displayName ?? spec.label);
  const [accountId, setAccountId] = useState(integration?.externalAccountId ?? '');
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const create = useCreateChannel();
  const update = useUpdateChannel();
  const remove = useDeleteChannel();

  const connected = Boolean(integration);
  const pending = create.isPending || update.isPending || remove.isPending;

  // Built from the configured API origin, never from the browser's.
  // Deriving it from window.location gave the *frontend* origin in any
  // deployment without an explicit port — an URL that looks plausible, gets
  // pasted into the provider console, and silently never delivers. The
  // backend deliberately returns `webhookPath` relative for this reason.
  const webhookUrl = integration
    ? `${API_BASE.replace(/\/$/, '')}${integration.webhookPath}`
    : null;

  async function copyWebhook() {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context; the URL is selectable
      // on screen, so failing silently is better than an alarming toast.
    }
  }

  function submit() {
    // Only non-empty secrets are sent. The backend merges, so an untouched
    // field keeps its stored value — which is the only way to edit a name
    // without re-entering every credential.
    const credentials = Object.fromEntries(
      Object.entries(secrets).filter(([, value]) => value.trim().length > 0),
    );

    if (integration) {
      update.mutate(
        {
          id: integration.id,
          input: {
            displayName,
            externalAccountId: accountId,
            ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
          },
        },
        { onSuccess: () => { setOpen(false); setSecrets({}); } },
      );
      return;
    }

    create.mutate(
      { channel: spec.channel, displayName, externalAccountId: accountId, credentials },
      { onSuccess: () => { setOpen(false); setSecrets({}); } },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn('flex size-9 items-center justify-center rounded-lg', spec.brand)}>
                <Plug className="size-4" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {integration?.displayName ?? spec.label}
                  {connected ? (
                    <Badge variant={integration?.isActive ? 'default' : 'secondary'}>
                      {integration?.isActive ? 'เชื่อมต่อแล้ว' : 'ปิดใช้งาน'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">ยังไม่เชื่อมต่อ</Badge>
                  )}
                </CardTitle>
                {/* The provider name is only worth repeating when the admin
                    renamed the integration to something else. */}
                {integration && integration.displayName !== spec.label && (
                  <CardDescription>{spec.label}</CardDescription>
                )}
                {!integration && <CardDescription>ยังไม่ได้ตั้งค่า</CardDescription>}
              </div>
            </div>

            <Button variant={connected ? 'outline' : 'default'} size="sm" onClick={() => setOpen(!open)}>
              {open ? 'ปิด' : connected ? 'แก้ไข' : 'เชื่อมต่อ'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {integration?.lastError && (
            <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border p-2.5 text-xs">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <div>
                <p className="font-medium">ส่งข้อความล่าสุดไม่สำเร็จ</p>
                <p className="mt-0.5 break-all opacity-90">{integration.lastError}</p>
              </div>
            </div>
          )}

          {connected && webhookUrl && (
            <div>
              <Label className="text-xs">Webhook URL</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="bg-muted flex-1 truncate rounded-md px-2.5 py-1.5 text-xs">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyWebhook}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">{spec.setupHint}</p>
            </div>
          )}

          {connected && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span className="text-muted-foreground">
                ข้อความล่าสุด:{' '}
                {integration?.lastInboundAt
                  ? new Date(integration.lastInboundAt).toLocaleString('th-TH')
                  : 'ยังไม่มี'}
              </span>
              <span className="flex items-center gap-1.5">
                {spec.credentials.map((field) => (
                  <span key={field.key} className="text-muted-foreground flex items-center gap-1">
                    {integration?.credentialStatus[field.key] ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <X className="text-destructive size-3" />
                    )}
                    {field.label}
                  </span>
                ))}
              </span>
            </div>
          )}

          {open && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label htmlFor={`${spec.channel}-name`}>ชื่อที่แสดง</Label>
                <Input
                  id={`${spec.channel}-name`}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`${spec.channel}-account`}>{spec.accountIdLabel}</Label>
                <Input
                  id={`${spec.channel}-account`}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mt-1"
                />
                <p className="text-muted-foreground mt-1 text-[11px]">{spec.accountIdHint}</p>
              </div>

              {spec.credentials.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`${spec.channel}-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`${spec.channel}-${field.key}`}
                    type="password"
                    autoComplete="off"
                    // Never pre-filled: the server does not return secrets, not
                    // even masked, so there is nothing to show. Empty means
                    // "leave as is" when editing.
                    placeholder={
                      integration?.credentialStatus[field.key] ? 'ตั้งค่าไว้แล้ว — เว้นว่างเพื่อคงเดิม' : ''
                    }
                    value={secrets[field.key] ?? ''}
                    onChange={(e) => setSecrets({ ...secrets, [field.key]: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-muted-foreground mt-1 text-[11px]">{field.hint}</p>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                {integration ? (
                  // Switch renders its own <label>, so this is a sibling span
                  // rather than a wrapping label — nesting labels is invalid
                  // and breaks the click target.
                  <span className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={integration.isActive}
                      disabled={pending}
                      onChange={(event) =>
                        update.mutate({
                          id: integration.id,
                          input: { isActive: event.target.checked },
                        })
                      }
                    />
                    เปิดใช้งาน
                  </span>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  {integration && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() => remove.mutate(integration.id)}
                    >
                      ยกเลิกการเชื่อมต่อ
                    </Button>
                  )}
                  <Button size="sm" onClick={submit} disabled={pending}>
                    <Link2 className="size-3.5" />
                    {integration ? 'บันทึก' : 'เชื่อมต่อ'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
