import Link from "next/link";
import type { ReactNode } from "react";
import {
  FaArrowRight,
  FaBookOpen,
  FaCircleInfo,
  FaShieldHalved,
} from "react-icons/fa6";
import { PageHeader } from "@/features/admin/components";
import {
  helpGuardrails,
  helpNeedHelpTips,
  helpQuickStartSteps,
  helpRoleGuides,
} from "@/features/help/content";

function SectionCard({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#51724f]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-[13px] leading-5 text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#51724f]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function HelpHub() {
  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        eyebrow="Trợ giúp"
        title="Hướng dẫn ngắn"
        description="Đọc 1 phút là đủ để bắt đầu."
        action={
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <FaArrowRight className="text-xs" />
            <span>Về dashboard</span>
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/70 bg-white/90 p-3.5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaBookOpen className="text-[#51724f]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Bắt đầu
            </p>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-slate-600">
            Thêm món, tạo đơn, xem tiền.
          </p>
        </div>
        <div className="rounded-[22px] border border-white/70 bg-white/90 p-3.5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaShieldHalved className="text-[#51724f]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Quy tắc
            </p>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-slate-600">
            Đơn lưu rồi thì giữ giá.
          </p>
        </div>
        <div className="rounded-[22px] border border-white/70 bg-white/90 p-3.5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaCircleInfo className="text-[#51724f]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Khi kẹt
            </p>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-slate-600">
            Xem popup hướng dẫn hoặc quay lại dashboard.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          { href: "#bat-dau-nhanh", label: "Bắt đầu" },
          { href: "#quy-tac", label: "Quy tắc" },
          { href: "#vai-tro", label: "Vai trò" },
          { href: "#khi-ket", label: "Khi kẹt" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <SectionCard
        id="bat-dau-nhanh"
        eyebrow="Bắt đầu nhanh"
        title="3 việc đầu tiên"
        description="Làm đúng thứ tự này là đủ để vào việc."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {helpQuickStartSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Bước {index + 1}
              </p>
              <h3 className="mt-1 text-[13px] font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="quy-tac"
        eyebrow="Quy tắc"
        title="Rule ngắn"
        description="Đây là 3 điều nên nhớ khi thao tác."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {helpGuardrails.map((rule) => (
            <div
              key={rule.title}
              className="rounded-[18px] border border-slate-200 bg-white p-3.5"
            >
              <p className="text-[13px] font-semibold text-slate-900">
                {rule.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                {rule.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="vai-tro"
        eyebrow="Vai trò"
        title="Ai làm gì"
        description="Mỗi người chỉ cần biết phần của mình."
      >
        <div className="grid gap-3 xl:grid-cols-3">
          {helpRoleGuides.map((role) => (
            <div
              key={role.roleCode}
              className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {role.roleLabel}
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-900">
                {role.scope}
              </p>
              <div className="mt-3">
                <BulletList items={role.responsibilities} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="khi-ket"
        eyebrow="Khi kẹt"
        title="Nếu không biết bấm gì"
        description="Dùng 3 gợi ý này trước khi hỏi hỗ trợ."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {helpNeedHelpTips.map((tip) => (
            <div
              key={tip.title}
              className="rounded-[18px] border border-slate-200 bg-white p-3.5"
            >
              <p className="text-[13px] font-semibold text-slate-900">{tip.title}</p>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
