import Link from "next/link";
import type { ReactNode } from "react";
import {
  FaArrowRight,
  FaBookOpen,
  FaBug,
  FaClipboardCheck,
  FaClock,
  FaShieldHalved,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { PageHeader, StatusPill } from "@/features/admin/components";
import {
  helpChecklists,
  helpDailyPlaybook,
  helpGuardrails,
  helpQuickStartSteps,
  helpRbacSummary,
  helpRoleGuides,
  helpTroubleshootingItems,
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
      className="scroll-mt-24 rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#51724f]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#51724f]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RuleBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
          <FaTriangleExclamation className="text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function HelpHub() {
  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        eyebrow="Trợ giúp"
        title="Trợ giúp / SOP"
        description="Bắt đầu nhanh, SOP, checklist và lỗi thường gặp."
        action={
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <FaArrowRight className="text-xs" />
            <span>Mở dashboard</span>
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaBookOpen className="text-[#51724f]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Bắt đầu
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            4 bước đầu cho user mới.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaShieldHalved className="text-[#51724f]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Rule chính
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Giữ snapshot, FEFO và log.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <FaClipboardCheck className="text-[#51724f]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Checklist
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Rà nhanh trước khi chốt.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          { href: "#bat-dau-nhanh", label: "Bắt đầu nhanh" },
          { href: "#quy-tac", label: "Quy tắc chính" },
          { href: "#sop-vai-tro", label: "Theo vai trò" },
          { href: "#daily-playbook", label: "Vận hành hằng ngày" },
          { href: "#checklist", label: "Checklist" },
          { href: "#xu-ly-loi", label: "Xử lý lỗi" },
          { href: "#rbac", label: "Phân quyền" },
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
        title="30 phút đầu"
        description="Làm theo thứ tự để khỏi sai."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {helpQuickStartSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <StatusPill
                  label={`Bước ${index + 1}`}
                  tone={index === 0 ? "info" : "muted"}
                />
                <FaClock className="text-slate-400" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="quy-tac"
        eyebrow="Quy tắc nền"
        title="Rule chính"
        description="Các rule nền cần nhớ."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {helpGuardrails.map((rule) => (
            <RuleBanner
              key={rule.title}
              title={rule.title}
              description={rule.description}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="sop-vai-tro"
        eyebrow="Theo vai trò"
        title="Theo vai trò"
        description="Mỗi role làm phần việc của mình."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {helpRoleGuides.map((role) => (
            <div
              key={role.roleCode}
              className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {role.roleLabel}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {role.scope}
                  </p>
                </div>
                <StatusPill label={role.roleLabel} tone="muted" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Trách nhiệm
                </p>
                <div className="mt-2">
                  <BulletList items={role.responsibilities} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Không nên quên
                </p>
                <div className="mt-2">
                  <BulletList items={role.guardrails} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="daily-playbook"
        eyebrow="Vận hành hằng ngày"
        title="Hằng ngày"
        description="Cách làm trong ngày."
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {helpDailyPlaybook.map((section) => (
            <div
              key={section.title}
              className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{section.summary}</p>
              <div className="mt-3">
                <BulletList items={section.steps} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="checklist"
        eyebrow="Checklist"
        title="Checklist"
        description="Rà nhanh trước khi chốt."
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {helpChecklists.map((section) => (
            <div
              key={section.title}
              className="rounded-[22px] border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{section.title}</p>
              <div className="mt-3">
                <BulletList items={section.items} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="xu-ly-loi"
        eyebrow="Xử lý lỗi"
        title="Lỗi và ngoại lệ"
        description="Đối chiếu rồi giữ lịch sử."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {helpTroubleshootingItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
                  <FaBug className="text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.symptom}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Nguyên nhân hay gặp
                  </p>
                  <div className="mt-2">
                    <BulletList items={item.cause} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Cách xử lý đúng
                  </p>
                  <div className="mt-2">
                    <BulletList items={item.fix} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="rbac"
        eyebrow="Phân quyền"
        title="Phân quyền"
        description="Mở cho mọi user đã đăng nhập."
      >
        <div className="grid gap-3 xl:grid-cols-3">
          {helpRbacSummary.map((item) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
