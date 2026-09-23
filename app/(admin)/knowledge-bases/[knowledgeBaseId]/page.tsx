import { KnowledgeBaseDetail } from '@/components/knowledge-base/knowledge-base-detail';

export default async function KnowledgeBasePage({
  params,
}: {
  params: Promise<{ knowledgeBaseId: string }>;
}) {
  const { knowledgeBaseId } = await params;
  return <KnowledgeBaseDetail knowledgeBaseId={knowledgeBaseId} />;
}
