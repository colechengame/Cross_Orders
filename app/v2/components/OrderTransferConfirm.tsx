/**
 * 訂單轉移確認組件
 * 用於跨店訂單轉移，實際課程消耗回到各自系統操作
 */

import { useState } from "react";
import type { BUCode } from "../types";
import type { ISimplifiedOrder } from "../utils/mockData";

interface OrderTransferConfirmProps {
  order: ISimplifiedOrder;
  currentBU: BUCode;
  onConfirm: (transferReason: string) => void;
  onCancel: () => void;
  className?: string;
}

export default function OrderTransferConfirm({
  order,
  currentBU,
  onConfirm,
  onCancel,
  className = "",
}: OrderTransferConfirmProps) {
  const [transferReason, setTransferReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  const isCrossBU = order.bu !== currentBU;

  // 轉移原因選項
  const reasonOptions = [
    { value: "consumption", label: "課程消耗", description: "會員在本店消耗跨店訂單" },
    { value: "relocation", label: "會員搬遷", description: "會員搬家後固定在本店消費" },
    { value: "request", label: "會員要求", description: "會員主動要求轉移訂單" },
    { value: "service", label: "服務需求", description: "本店有特定服務項目" },
    { value: "custom", label: "其他原因", description: "自訂轉移原因" },
  ];

  // 處理確認
  const handleConfirm = () => {
    if (!transferReason) {
      setError("請選擇轉移原因");
      return;
    }

    if (transferReason === "custom" && !customReason.trim()) {
      setError("請輸入自訂轉移原因");
      return;
    }

    const finalReason =
      transferReason === "custom"
        ? customReason.trim()
        : reasonOptions.find((opt) => opt.value === transferReason)?.label || "";

    onConfirm(finalReason);
  };

  if (!isCrossBU) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
          <svg
            className="mx-auto h-12 w-12 text-amber-500 mb-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
            無需轉移
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            此訂單屬於本店 ({currentBU})，不需要進行跨店轉移
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            請直接在原系統進行課程消耗操作
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-stone-200 dark:bg-stone-700
                       text-stone-700 dark:text-stone-200 rounded-xl
                       hover:bg-stone-300 dark:hover:bg-stone-600
                       transition-colors font-medium"
          >
            返回訂單列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 訂單摘要 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-50 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          跨店訂單轉移
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-800 dark:text-blue-200">課程名稱</span>
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {order.courseName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-800 dark:text-blue-200">剩餘數量</span>
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {order.remainingQuantity} {order.quantityUnit}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-blue-800 dark:text-blue-200">轉移方向</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg font-semibold">
                {order.bu}
              </span>
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 rounded-lg font-semibold">
                {currentBU}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 轉移說明 */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
              重要說明
            </h5>
            <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <li>• 訂單轉移後，歸屬權將變更至 {currentBU}</li>
              <li>• 實際課程消耗請在 {currentBU} 系統中進行操作</li>
              <li>• 轉移記錄將保留於兩店系統，供財務結算使用</li>
              <li>• 原店 ({order.bu}) 將顯示「已轉出」狀態</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 轉移原因選擇 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          轉移原因：<span className="text-red-500">*</span>
        </label>

        <div className="space-y-2">
          {reasonOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${
                  transferReason === option.value
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700"
                }`}
            >
              <input
                type="radio"
                name="transferReason"
                value={option.value}
                checked={transferReason === option.value}
                onChange={(e) => {
                  setTransferReason(e.target.value);
                  setError("");
                }}
                className="mt-1 w-5 h-5 text-amber-500 border-stone-300 dark:border-stone-600
                           focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  {option.label}
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* 自訂原因輸入 */}
        {transferReason === "custom" && (
          <div className="pt-2">
            <textarea
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setError("");
              }}
              placeholder="請詳細說明轉移原因..."
              rows={3}
              className="w-full px-4 py-3 text-base border border-stone-300 dark:border-stone-600
                         rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                         placeholder-stone-400 dark:placeholder-stone-500
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-all duration-200"
            />
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-stone-200 dark:bg-stone-700
                     text-stone-700 dark:text-stone-200 rounded-xl
                     hover:bg-stone-300 dark:hover:bg-stone-600
                     transition-colors font-medium"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl
                     hover:bg-amber-600 active:bg-amber-700
                     transition-colors font-medium
                     shadow-md hover:shadow-lg
                     flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          確認轉移訂單
        </button>
      </div>
    </div>
  );
}
