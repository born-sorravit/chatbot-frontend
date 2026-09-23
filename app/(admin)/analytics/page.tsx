import { AnalyticsView } from '@/components/analytics/analytics-view';

/**
 * Phase 7 analytics (master plan §45).
 *
 * The cost panels inside render only for users holding `settings.read`, which
 * is what keeps spend out of an AGENT's view. That check is a convenience —
 * the endpoint enforces it server-side regardless.
 */
export default function AnalyticsPage() {
  return <AnalyticsView />;
}
