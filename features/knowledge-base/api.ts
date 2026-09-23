'use client';

import { apiClient } from '@/lib/api-client';
import type {
  ApiEnvelope,
  DocumentSource,
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeSearchResult,
} from '@/types/api';

export async function fetchKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await apiClient.get<ApiEnvelope<KnowledgeBase[]>>('/admin/knowledge-bases');
  return response.data;
}

export async function fetchKnowledgeBase(id: string): Promise<KnowledgeBase> {
  const response = await apiClient.get<ApiEnvelope<KnowledgeBase>>(`/admin/knowledge-bases/${id}`);
  return response.data;
}

export async function createKnowledgeBase(input: {
  name: string;
  description?: string;
}): Promise<KnowledgeBase> {
  const response = await apiClient.post<ApiEnvelope<KnowledgeBase>>(
    '/admin/knowledge-bases',
    input,
  );
  return response.data;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await apiClient.delete<void>(`/admin/knowledge-bases/${id}`);
}

export async function fetchDocuments(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
  const response = await apiClient.get<ApiEnvelope<KnowledgeDocument[]>>(
    `/admin/knowledge-bases/${knowledgeBaseId}/documents`,
  );
  return response.data;
}

export async function createDocument(
  knowledgeBaseId: string,
  input: { title: string; sourceType: DocumentSource; content?: string; sourceUrl?: string },
): Promise<KnowledgeDocument> {
  const response = await apiClient.post<ApiEnvelope<KnowledgeDocument>>(
    `/admin/knowledge-bases/${knowledgeBaseId}/documents`,
    input,
  );
  return response.data;
}

export async function reindexDocument(documentId: string): Promise<KnowledgeDocument> {
  const response = await apiClient.post<ApiEnvelope<KnowledgeDocument>>(
    `/admin/documents/${documentId}/reindex`,
  );
  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete<void>(`/admin/documents/${documentId}`);
}

export async function searchKnowledge(
  knowledgeBaseId: string,
  q: string,
): Promise<KnowledgeSearchResult> {
  const query = new URLSearchParams({ q, limit: '5' });
  const response = await apiClient.get<ApiEnvelope<KnowledgeSearchResult>>(
    `/admin/knowledge-bases/${knowledgeBaseId}/search?${query}`,
  );
  return response.data;
}
