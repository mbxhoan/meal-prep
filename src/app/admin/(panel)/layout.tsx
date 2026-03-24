import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/components";
import { getAdminContext } from "@/lib/admin/service";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getAdminContext();

  if (context.configured && !context.user) {
    redirect("/admin/login");
  }

  if (context.configured && !context.canAccessPanel) {
    redirect("/admin/login?reason=permission");
  }

  return <AdminShell context={context}>{children}</AdminShell>;
}
