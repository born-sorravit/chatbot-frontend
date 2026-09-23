import { InboxWorkspace } from '@/components/inbox/inbox-workspace';

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <InboxWorkspace conversationId={conversationId} />;
}
