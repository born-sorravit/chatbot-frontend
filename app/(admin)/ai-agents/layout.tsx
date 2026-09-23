import { AdminShell } from '@/components/admin-shell';

export default function AiAgentsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell><main className="flex-1 p-6">{children}</main></AdminShell>;
}
