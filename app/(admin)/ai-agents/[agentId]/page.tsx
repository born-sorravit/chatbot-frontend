import { AgentSettings } from '@/components/ai-agents/agent-settings';

export default async function AiAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return <AgentSettings agentId={agentId} />;
}
