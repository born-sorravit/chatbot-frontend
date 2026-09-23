import { AdminShell } from '@/components/admin-shell';

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
