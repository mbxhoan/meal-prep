import LoadingSpinner from "@/shared/components/LoadingSpinner";

export default function AdminPanelLoading() {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3">
        <LoadingSpinner size={18} color="#18352d" />
        <p className="text-sm font-medium text-slate-700">
          Đang tải dữ liệu trang...
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-6 w-1/3 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      </div>
    </section>
  );
}
