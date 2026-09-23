import { InboxWorkspace } from '@/components/inbox/inbox-workspace';

/**
 * Inbox with nothing selected.
 *
 * A static route rather than an optional catch-all: `typedRoutes` only
 * generates `/inbox/` for `[[...slug]]`, so a plain `/inbox` link would not
 * type-check and would redirect on every click.
 */
export default function InboxIndexPage() {
  return <InboxWorkspace />;
}
