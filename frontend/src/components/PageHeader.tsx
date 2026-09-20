import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 px-6 md:px-10 pt-8 pb-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink50 bg-gradient-to-r from-ink50 to-brand-soft bg-clip-text">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink70">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}