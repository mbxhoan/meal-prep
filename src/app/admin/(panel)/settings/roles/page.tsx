import { RoleAssignmentForm } from "@/features/admin/components";
import { getRbacDirectory } from "@/lib/rbac/server";

export default async function AdminRolesPage() {
  const directory = await getRbacDirectory();

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Phân quyền user theo shop
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
          Màn này dùng để gán role vào user_shop_roles, đồng thời sync employee
          profile và snapshot role trên profiles để các policy cũ vẫn chạy ổn.
        </p>
      </section>

      <RoleAssignmentForm directory={directory} />
    </div>
  );
}
