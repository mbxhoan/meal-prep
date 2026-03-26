import { RoleAssignmentForm } from "@/features/admin/components";
import { getRbacDirectory } from "@/lib/rbac/server";

export default async function AdminRolesPage() {
  const directory = await getRbacDirectory();

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Thiết lập
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
          Phân quyền
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Gán vai trò và shop cho user.
        </p>
      </section>

      <RoleAssignmentForm directory={directory} />
    </div>
  );
}
