import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cross Orders B 版 - 跨集團訂單轉移系統",
  description: "全新重寫的跨 BU 訂單轉移與課程消耗管理系統",
};

export default function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
      {/* B 版標識 */}
      <div className="fixed top-4 right-4 z-50">
        <div className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-semibold shadow-lg">
          B 版（開發中）
        </div>
      </div>

      {children}
    </div>
  );
}
