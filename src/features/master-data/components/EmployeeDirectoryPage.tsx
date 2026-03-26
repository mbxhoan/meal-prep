import { FaUsers, FaUserTie } from "react-icons/fa6";
import { StatusPill } from "@/features/admin/components/StatusPill";
import { formatDate } from "@/lib/admin/format";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  job_title: string | null;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
};

type StaffMemberRow = {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
};

export async function EmployeeDirectoryPage({
  shopName,
}: {
  shopName: string;
}) {
  let employees: EmployeeRow[] = [];
  let staffMembers: StaffMemberRow[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      const [employeesResult, staffResult] = await Promise.all([
        supabase
          .from("employees")
          .select(
            "id, employee_code, full_name, phone, email, job_title, is_active, notes, updated_at",
          )
          .order("updated_at", { ascending: false }),
        supabase
          .schema("seed_import")
          .from("staff_members")
          .select("id, full_name, phone, address, notes, source")
          .order("full_name", { ascending: true }),
      ]);

      if (!employeesResult.error && Array.isArray(employeesResult.data)) {
        employees = employeesResult.data as EmployeeRow[];
      }

      if (!staffResult.error && Array.isArray(staffResult.data)) {
        staffMembers = staffResult.data as StaffMemberRow[];
      }
    }
  }

  const hasBusinessEmployees = employees.length > 0;
  const fallbackRows = hasBusinessEmployees ? [] : staffMembers;

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
              Danh mục nền tảng
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              Nhân viên
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Hồ sơ nhân sự của shop. Nếu chưa có `public.employees`, sẽ hiện
              dữ liệu nguồn từ Excel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={shopName} tone="info" />
            <StatusPill
              label={
                hasBusinessEmployees
                  ? `${employees.length} hồ sơ`
                  : `${staffMembers.length} nhân sự nguồn Excel`
              }
              tone="success"
            />
            <StatusPill
              label={
                hasBusinessEmployees
                  ? "Đã liên kết business schema"
                  : "Chưa có hồ sơ user-linked"
              }
              tone={hasBusinessEmployees ? "success" : "warning"}
            />
          </div>
        </div>
      </section>

      {hasBusinessEmployees ? (
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <FaUsers className="text-[#51724f]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Danh sách nhân viên
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Họ tên</th>
                  <th className="px-5 py-3 font-medium">Điện thoại</th>
                  <th className="px-5 py-3 font-medium">Chức danh</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {row.employee_code ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{row.full_name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.job_title ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(row.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2">
            <FaUserTie className="text-[#51724f]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Nhân sự nguồn Excel
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            `public.employees` chưa có dữ liệu. Danh sách dưới đây là nguồn từ
            Excel để đối chiếu.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Tên</th>
                  <th className="px-5 py-3 font-medium">Điện thoại</th>
                  <th className="px-5 py-3 font-medium">Ghi chú</th>
                  <th className="px-5 py-3 font-medium">Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {fallbackRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {row.full_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.notes ?? row.address ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {row.source ?? "Excel"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
