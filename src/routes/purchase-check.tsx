import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/store/AppStore";
import { PageHeader } from "@/components/vioi/primitives";
import { PurchaseSimulator } from "@/components/vioi/PurchaseSimulator";

export const Route = createFileRoute("/purchase-check")({
  head: () => ({
    meta: [
      { title: "Có nên mua không? — VÍOI" },
      { name: "description", content: "Xem món đồ ảnh hưởng thế nào đến ví của bạn trước khi quyết định mua." },
      { property: "og:title", content: "Can I Afford It? — VÍOI" },
      { property: "og:description", content: "Simulate a purchase and see its impact on your safe-to-spend budget." },
    ],
  }),
  component: PurchasePage,
});

function PurchasePage() {
  const { t } = useApp();
  return (
    <>
      <PageHeader title={t.purchase.title} subtitle={t.purchase.subtitle} />
      <PurchaseSimulator />
    </>
  );
}
