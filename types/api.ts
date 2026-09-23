/**
 * Mirrored backend contracts (docs/ARCHITECTURE.md TD-02).
 *
 * There is no shared types package — the two apps are separate deployables.
 * Each type below names the backend file it mirrors; if you change one,
 * change the other. Extract a package when this file stops being small.
 */

/** Mirrors chatbots-backend/src/shared/constants/permissions.ts */
export enum UserRole {
  Owner = 'OWNER',
  Admin = 'ADMIN',
  Agent = 'AGENT',
}

/** Mirrors chatbots-backend/src/shared/constants/permissions.ts */
export const Permission = {
  ConversationRead: 'conversation.read',
  ConversationReply: 'conversation.reply',
  ConversationTakeover: 'conversation.takeover',
  ConversationClose: 'conversation.close',
  KnowledgeRead: 'knowledge.read',
  KnowledgeWrite: 'knowledge.write',
  AiRead: 'ai.read',
  AiWrite: 'ai.write',
  SettingsRead: 'settings.read',
  SettingsWrite: 'settings.write',
  UserRead: 'user.read',
  UserWrite: 'user.write',
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

/** Mirrors the AuthResult['user'] shape in auth.service.ts */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  permissions: PermissionValue[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors docs/API.md §0 — the response envelope. */
export interface ApiEnvelope<T> {
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginatedEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

/* ── Phase 2: conversations & messages ──────────────────────────────────
 * Mirrors chatbots-backend/src/shared/constants/conversation.ts
 */

export enum ConversationStatus {
  Open = 'OPEN',
  Pending = 'PENDING',
  Closed = 'CLOSED',
}

export enum ConversationMode {
  Ai = 'AI',
  Human = 'HUMAN',
}

export enum MessageSenderType {
  Customer = 'CUSTOMER',
  Ai = 'AI',
  Admin = 'ADMIN',
  System = 'SYSTEM',
}

export enum MessageType {
  Text = 'TEXT',
  Image = 'IMAGE',
  File = 'FILE',
  System = 'SYSTEM',
}

export type HandoffReason =
  | 'CUSTOMER_REQUESTED'
  | 'AI_CANNOT_ANSWER'
  | 'NO_KNOWLEDGE_FOUND'
  | 'TOOL_ERROR'
  | 'PROVIDER_ERROR'
  | 'SENSITIVE_TOPIC'
  | 'BUSINESS_RULE'
  | 'MANUAL_TAKEOVER';

/** Mirrors chat.serializer.ts — the customer projection. */
export interface CustomerMessage {
  id: string;
  senderType: MessageSenderType;
  senderName: string | null;
  content: string | null;
  type: MessageType;
  createdAt: string;
  clientMessageId?: string;
  /** Client-only: set on an optimistic bubble until the server row arrives. */
  pending?: boolean;
  failed?: boolean;
}

export interface CustomerConversation {
  id: string;
  status: ConversationStatus;
  mode: ConversationMode;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatSession {
  sessionToken: string;
  customer: { id: string; name: string | null; email: string | null };
  conversation: CustomerConversation;
}

/** Mirrors conversations.serializer.ts — the admin projections. */
export interface InboxCustomer {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface InboxItem {
  id: string;
  customer: InboxCustomer | null;
  status: ConversationStatus;
  mode: ConversationMode;
  channel: string;
  assignedUser: { id: string; name: string; avatarUrl: string | null } | null;
  lastMessage: {
    content: string | null;
    senderType: MessageSenderType;
    type: MessageType;
    createdAt: string;
  } | null;
  unreadCount: number;
  handoffReason: HandoffReason | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ConversationDetail extends InboxItem {
  summary: string | null;
  aiAgentId: string | null;
  handoffAt: string | null;
  closedAt: string | null;
  customer:
    | (InboxCustomer & {
        phone: string | null;
        tags: string[];
        notes: string | null;
        metadata: Record<string, unknown>;
        createdAt: string;
      })
    | null;
}

export interface AdminMessage {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  content: string | null;
  type: MessageType;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}

export interface CursorEnvelope<T> {
  data: T[];
  meta: { hasMore: boolean; nextCursor: string | null };
}

export interface TypingEvent {
  conversationId: string;
  actorType: 'CUSTOMER' | 'ADMIN';
  actorName?: string;
}

/* ── Phase 3: AI ────────────────────────────────────────────────────────
 * Mirrors chatbots-backend/src/shared/constants/ai.ts
 */

export enum AIResponseState {
  Answered = 'ANSWERED',
  NeedMoreInformation = 'NEED_MORE_INFORMATION',
  ToolRequired = 'TOOL_REQUIRED',
  Handoff = 'HANDOFF',
}

/** Progress signal. A closed set — never render the raw value. */
export type AiThinkingStatus = 'thinking' | 'searching_knowledge' | 'checking_order';

export const AI_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type AiEffort = (typeof AI_EFFORT_LEVELS)[number];

/** Must match the backend allowlist; a value outside it is rejected with 400. */
export const ALLOWED_LLM_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'] as const;
export type AllowedLlmModel = (typeof ALLOWED_LLM_MODELS)[number];

export const AI_TONES = ['friendly', 'professional', 'casual', 'formal'] as const;
export type AiTone = (typeof AI_TONES)[number];

export interface AiAgent {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  language: string;
  tone: string;
  model: string;
  effort: string;
  maxTokens: number;
  maxContextMessages: number;
  autoReply: boolean;
  handoffEnabled: boolean;
  ragEnabled: boolean;
  isDefault: boolean;
  isActive: boolean;
  knowledgeBaseIds: string[];
  toolIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AiAgentTestResult {
  provider: string;
  model: string;
  latencyMs: number;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  estimatedCostUsd: number;
  state: AIResponseState | null;
  message: string | null;
  error?: string;
  /** Retrieval diagnostics — null when the agent has RAG disabled. */
  retrieval: {
    searched: boolean;
    maxDistance: number;
    chunks: { documentTitle: string; distance: number; preview: string }[];
  } | null;
}

export interface AiThinkingEvent {
  conversationId: string;
  status: AiThinkingStatus;
}

/* ── Phase 4: Knowledge base / RAG ──────────────────────────────────────
 * Mirrors chatbots-backend/src/shared/constants/knowledge.ts
 */

export enum DocumentStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Ready = 'READY',
  Failed = 'FAILED',
}

export enum DocumentSource {
  Text = 'TEXT',
  Markdown = 'MARKDOWN',
  Faq = 'FAQ',
  Pdf = 'PDF',
  Url = 'URL',
}

export interface KnowledgeBase {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string | null;
  sourceType: DocumentSource;
  sourceUrl: string | null;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  indexedAt: string | null;
  createdAt: string;
}

export interface KnowledgeSearchChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  distance: number;
  relevant: boolean;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResult {
  maxDistance: number;
  chunks: KnowledgeSearchChunk[];
}

/* ── Phase 5: Handoff & notifications ───────────────────────────────────
 * Mirrors chatbots-backend/src/shared/constants/notification.ts
 */

export enum NotificationType {
  NewConversation = 'NEW_CONVERSATION',
  CustomerRequestedHuman = 'CUSTOMER_REQUESTED_HUMAN',
  AiHandoff = 'AI_HANDOFF',
  NewMessage = 'NEW_MESSAGE',
  ToolApprovalRequired = 'TOOL_APPROVAL_REQUIRED',
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  conversationId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsEnvelope {
  data: AppNotification[];
  meta: { unreadCount: number };
}

/* ── Phase 6: AI tools ──────────────────────────────────────────────────
 * Mirrors chatbots-backend/src/shared/constants/tools.ts
 */

export enum ToolExecutionStatus {
  PendingApproval = 'PENDING_APPROVAL',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Running = 'RUNNING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

export interface AiToolSummary {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  mutating: boolean;
  isActive: boolean;
}

export interface ToolExecution {
  id: string;
  conversationId: string | null;
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: ToolExecutionStatus;
  errorMessage: string | null;
  approvedByUserId: string | null;
  durationMs: number | null;
  createdAt: string;
}

/* ── Phase 7: analytics ─────────────────────────────────────────────────
 * Mirrors chatbots-backend/src/modules/analytics/analytics.service.ts
 *
 * Every rate and average is `number | null`, never optional: the backend
 * returns null when the denominator is empty, and the distinction between
 * "no data" and "zero" is the whole point. `?? 0` on any of these fields
 * reintroduces the bug — render an em dash instead.
 */

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  conversations: {
    total: number;
    aiMode: number;
    humanMode: number;
    open: number;
    pending: number;
    closed: number;
    handedOff: number;
    /** Closed without ever recording a handoff. */
    aiResolved: number;
  };
  rates: {
    /** Over closed conversations only — null when none have closed. */
    aiResolution: number | null;
    /** Size of that denominator, so the UI can say why a rate is missing. */
    aiResolutionSampled: number;
    /** Over every conversation in the range — a handoff is an event. */
    handoff: number | null;
  };
  messages: {
    total: number;
    fromCustomer: number;
    fromAi: number;
    fromAdmin: number;
    perConversation: number | null;
  };
  responseTime: {
    averageSeconds: number | null;
    medianSeconds: number | null;
    sampled: number;
  };
  conversationDuration: {
    averageSeconds: number | null;
    sampled: number;
  };
  handoffReasons: Array<{ reason: string; count: number }>;
}

export interface AiUsageReport {
  range: AnalyticsRange;
  totals: {
    requests: number;
    succeeded: number;
    failed: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    averageLatencyMs: number | null;
    p95LatencyMs: number | null;
  };
  byModel: Array<{
    model: string;
    provider: string;
    requests: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  daily: Array<{
    date: string;
    requests: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  tools: {
    executions: number;
    succeeded: number;
    rejected: number;
    failed: number;
    averageDurationMs: number | null;
    byTool: Array<{ name: string; executions: number; succeeded: number }>;
  };
}

/* ── Phase 8: external channels ─────────────────────────────────────────
 * Mirrors chatbots-backend/src/modules/channels/channels-admin.service.ts
 */

export enum ChannelType {
  Web = 'web',
  Line = 'line',
  Facebook = 'facebook',
  Whatsapp = 'whatsapp',
}

export interface ChannelIntegration {
  id: string;
  channel: ChannelType;
  displayName: string;
  externalAccountId: string | null;
  isActive: boolean;
  /**
   * Which required credentials are set — booleans, never values.
   * The backend does not return secrets even masked, so the form always
   * starts empty and an untouched field leaves the stored value alone.
   */
  credentialStatus: Record<string, boolean>;
  /** Relative; the public origin depends on the deployment. */
  webhookPath: string;
  lastInboundAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface ChannelIntegrationInput {
  channel: ChannelType;
  displayName: string;
  externalAccountId?: string;
  credentials: Record<string, string>;
  isActive?: boolean;
}
