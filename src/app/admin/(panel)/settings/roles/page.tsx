import { RoleAssignmentForm } from "@/features/admin/components";
import { getRbacDirectory } from "@/lib/rbac/server";
import { ADMIN_SIMPLE_MODE } from "@/features/admin/config";

export default async function AdminRolesPage() {
  const directory = await getRbacDirectory();

  if (ADMIN_SIMPLE_MODE) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Tạm ẩn
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Phân quyền đang ẩn
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">
          Chế độ hiện tại chỉ giữ Món hàng, Đơn hàng và Doanh thu.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-[24px] border border-white/70 bg-white/90 px-4 py-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] md:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          Thiết lập
        </p>
        <h1 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
          Phân quyền
        </h1>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-slate-500">
          Gán vai trò và shop cho user.
        </p>
      </section>

      <RoleAssignmentForm directory={directory} />
    </div>
  );
}
