import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/store/AppStore";
import { AIChat, AIOrb } from "@/components/vioi/AIChat";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "VÍOI AI — Trợ lý tài chính" },
      { name: "description", content: "Trợ lý tài chính hiểu chiếc ví của bạn." },
      { property: "og:title", content: "VÍOI AI — Your financial assistant" },
      { property: "og:description", content: "Ask questions about your spending and get answers from your own data." },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const { t } = useApp();
  return (
    <>
      <div className="bg-ai shadow-glow-ai relative mb-5 flex items-center gap-4 overflow-hidden rounded-[24px] p-5">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <AIOrb size="lg" />
        <div className="relative min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight">{t.ai.title} ✨</h1>
          <p className="text-hero-foreground/85">{t.ai.subtitle}</p>
        </div>
      </div>
      <AIChat />
    </>
  );
}
