/**
 * BU 選擇器組件
 * 允許用戶切換搜尋哪個 BU 的會員
 */

import type { BUCode, IBU } from "../types";

interface BUSelectorProps {
  bus: IBU[];
  selectedBU: BUCode | null;
  onBUChange: (bu: BUCode) => void;
  className?: string;
  showLabel?: boolean; // 是否顯示標籤
}

export default function BUSelector({
  bus,
  selectedBU,
  onBUChange,
  className = "",
  showLabel = true,
}: BUSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          搜尋門市：
        </label>
      )}

      <select
        value={selectedBU || ""}
        onChange={(e) => onBUChange(e.target.value as BUCode)}
        className="w-full px-4 py-3 text-base border border-stone-300 dark:border-stone-600
                   rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                   transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500
                   shadow-sm hover:shadow-md"
      >
        <option value="" disabled>
          請選擇要搜尋的門市
        </option>
        {bus.map((bu) => (
          <option key={bu.code} value={bu.code}>
            {bu.displayName}
          </option>
        ))}
      </select>

      {selectedBU && (
        <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1">
          <svg
            className="w-4 h-4 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          目前搜尋：
          {bus.find((bu) => bu.code === selectedBU)?.name || selectedBU} 的會員
        </p>
      )}
    </div>
  );
}
