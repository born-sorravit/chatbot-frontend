import { z } from 'zod';
import { AI_EFFORT_LEVELS, AI_TONES, ALLOWED_LLM_MODELS } from '@/types/api';

/**
 * Mirrors UpdateAiAgentDto. Client-side validation is UX only — the server
 * validates independently, and the model allowlist is enforced there.
 */
export const agentFormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(200),
  description: z.string().max(2000).optional(),
  systemPrompt: z.string().min(20, 'System prompt ต้องมีอย่างน้อย 20 ตัวอักษร').max(20000),
  language: z.string().min(2).max(10),
  tone: z.enum(AI_TONES),
  model: z.enum(ALLOWED_LLM_MODELS),
  effort: z.enum(AI_EFFORT_LEVELS),
  // Plain number, not z.coerce: coercion makes the schema's input and output
  // types differ, which zodResolver cannot reconcile with useForm's single
  // TFieldValues. The number inputs register with `valueAsNumber` instead.
  maxTokens: z.number().int().min(256).max(8192),
  maxContextMessages: z.number().int().min(1).max(100),
  autoReply: z.boolean(),
  handoffEnabled: z.boolean(),
  ragEnabled: z.boolean(),
  /**
   * Replace-semantics, matching the API: the array sent becomes the complete
   * set. Partial updates to a permission-like list are how a link stays
   * active after someone thought they removed it.
   */
  knowledgeBaseIds: z.array(z.string()),
  /** The tool allowlist. Replace-semantics, same as knowledgeBaseIds. */
  toolIds: z.array(z.string()),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;
