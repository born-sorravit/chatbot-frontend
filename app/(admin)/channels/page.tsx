import { ChannelsView } from '@/components/channels/channels-view';

/**
 * Phase 8 channel settings (master plan §47).
 *
 * Reached only by users holding `settings.read`; the endpoints behind it
 * require `settings.write` to change anything. Connecting a channel hands a
 * third party a path into the inbox, so it is deliberately owner-level.
 */
export default function ChannelsPage() {
  return <ChannelsView />;
}
