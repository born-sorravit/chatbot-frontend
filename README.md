# chatbots-frontend

Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind 4 · shadcn/ui (Radix) ·
motion.dev · TanStack Query · Zustand · React Hook Form + Zod

## Scope so far

**Phase 1** — admin login, session handling, dashboard.
**Phase 2** — customer chat widget (`/chat`), admin inbox (`/inbox`), realtime over
Socket.IO, typing indicators, unread badges. Attachments are not built; see
[`../docs/API.md`](../docs/API.md) §2.
**Phase 3** — AI agent settings (`/ai-agents`) with an editable system prompt and
a dry-run test panel, the `ai:thinking` indicator in the customer chat, and the
handoff-reason banner in the inbox.
**Phase 4** — Knowledge bases (`/knowledge-bases`): document CRUD with live
indexing status, a retrieval debugger showing distances, and knowledge-base
selection on the agent form.
**Phase 5** — Take Over / Return to AI in the inbox, a live notification bell in
the header, and a "talk to a human" button in the customer chat.
**Phase 6** — Tool allowlist on the agent form and a tool execution log showing
inputs, outputs, durations and rejections, with approve/reject controls.
**Phase 7** — An analytics page plus headline metrics on the dashboard. Charts
are hand-rolled SVG rather than a charting library (ARCHITECTURE TD-45), and the
cost panels render only for `settings.read`, so an AGENT never sees spend.
**Phase 8** — A channel settings page for connecting LINE, Facebook and
WhatsApp, and a channel badge on inbox rows. Credential fields are always
blank: the API never returns secrets, so an empty field means "leave as is".

## Setup

```bash
nvm use
cp .env.example .env.local
npm install
npm run dev     # http://localhost:3000
```

The backend must be running on `http://localhost:4000`.

## Layout

```
app/
├── layout.tsx                    providers + auth rehydration
├── (customer)/chat/              anonymous session, mobile-first
└── (admin)/                      JWT, desktop-first
    ├── login/                    public
    ├── dashboard/
    ├── inbox/[conversationId]/   three-pane inbox
    ├── ai-agents/[agentId]/      agent settings + test panel
    ├── knowledge-bases/[knowledgeBaseId]/  documents + retrieval debugger
    ├── analytics/                metrics, cost, daily usage
    └── channels/                 connect LINE / Facebook / WhatsApp
components/
├── ui/                     shadcn primitives
├── chat/                   message bubble · typing · connection banner
├── inbox/                  list · conversation pane · customer panel · workspace
├── analytics/              stat cards · SVG daily chart · breakdown bars
├── channels/               per-provider connect card
├── auth-guard.tsx          client-side route guard
├── auth-hydration.tsx      triggers persisted-store rehydration
└── app-header.tsx
features/auth/              schema · api · hooks
features/chat/              customer-side api · hooks · session store
features/inbox/             admin-side api · hooks
features/analytics/         api · hooks · value formatters
features/channels/          api · hooks · provider catalogue
lib/                        api-client · api-error · query-client · socket · utils
stores/                     Zustand auth store
types/api.ts                mirrored backend contracts
```

The `(admin)` route group exists so the customer chat added in Phase 2 can live
under its own group and never ship admin code in the same bundle.

## Things worth knowing

**No shared types package.** The two apps are separate deployables
([`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) TD-02). `types/api.ts` mirrors
the backend contracts by hand and names the file each type mirrors. Extract a
package when this stops being small.

**Auth state lives in localStorage.** A page refresh must not log the admin out.
This is a stated MVP tradeoff, not an oversight: anything stored there is readable
by an XSS on this origin. Access tokens are short-lived (15m) and refresh tokens
rotate with replay detection, which bounds the damage. Moving to httpOnly cookies
is a Phase 2 hardening item.

**The store uses `skipHydration`.** `<AuthHydration/>` triggers rehydration in an
effect. Left automatic, localStorage would be read synchronously on the client but
not on the server, so the two renders would disagree — a React hydration mismatch.

**`AuthGuard` is UX, not security.** Every protected endpoint is enforced
server-side. Bypassing the guard gets you an empty screen and a 401, not data.

**Errors branch on `code`, never on the message string** — messages are prose and
may be localised or reworded. See `lib/api-error.ts` and the mapping in the login
page.

**One refresh at a time — across tabs, not just within one.** The API client
de-duplicates concurrent refreshes with a module-scoped guard *and* a
`navigator.locks` lock. The lock is the part that matters: a per-tab guard does
nothing across tabs, and two tabs refreshing the same expired token makes the
second look like a replay to the backend, which signs the admin out everywhere.
Verified with two real tabs — see ARCHITECTURE TD-18.

**Socket events never own data.** They write into the TanStack Query cache and
the REST endpoints stay the source of truth (ARCHITECTURE §2.3). Messages dedupe
by `id`, and by `clientMessageId` so a server row replaces this client's own
optimistic bubble rather than appearing next to it. Every (re)connect refetches,
which is what makes Socket.IO's at-most-once delivery survivable.

**One socket for the whole admin surface.** `AdminShell` owns it and every admin
layout renders through it: the notification bell sits in the header and must stay
live on the dashboard, agent form and knowledge base too, and a provider per page
would double both connections and broadcasts (TD-34).

**Two routes, not an optional catch-all.** `/inbox` and `/inbox/[conversationId]`
are separate pages sharing one workspace component, because `typedRoutes` only
generates `/inbox/` for `[[...slug]]` — a plain `/inbox` link would not
type-check and would redirect on every click.

**AI progress is a status enum, never model text.** The server sends
`ai:thinking` with a closed set of statuses and the client maps them to Thai
copy. Rendering anything the model authored here is how internal reasoning
reaches a customer's screen.

**No `temperature` field.** Current Claude models reject sampling parameters, so
the agent form shows a line of helper text explaining that `effort` replaces it —
users will look for it otherwise.

**The agent form avoids `z.coerce`.** Coercion makes a Zod schema's input and
output types differ, which `zodResolver` cannot reconcile with `useForm`'s single
type parameter; number inputs use `register(..., { valueAsNumber: true })`.

**The document list polls only while something is in flight.** `refetchInterval`
returns a number when any document is PENDING or PROCESSING and `false`
otherwise, so PENDING → READY appears without a reload and the page stops
hammering the API once everything settles.

**The retrieval debugger shows distances without thresholding.** That is the
point: when someone says "the AI doesn't know our refund policy", it separates
"the chunk was never retrieved" from "it was retrieved but ranked past the
cut-off" — two completely different problems.

**`AGENTS.md` / `CLAUDE.md` are generated by `next dev`** and re-created on every
run. Commit them to keep the tree clean.
