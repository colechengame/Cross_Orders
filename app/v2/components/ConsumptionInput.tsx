/**
 * 課程消耗輸入組件
 * 處理課程消耗數量輸入和訂單轉移設定
 */

import { useState } from "react";
import type { BUCode } from "../types";
import type { ISimplifiedOrder } from "../utils/mockData";

interface ConsumptionInputProps {
  order: ISimplifiedOrder;
  currentBU: BUCode;
  onConfirm: (quantity: number, shouldTransfer: boolean) => void;
  onCancel: () => void;
  className?: string;
}

export default function ConsumptionInput({
  order,
  currentBU,
  onConfirm,
  onCancel,
  className = "",
}: ConsumptionInputProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [shouldTransfer, setShouldTransfer] = useState<boolean>(
    order.bu !== currentBU
  );
  const [error, setError] = useState<string>("");

  const isCrossBU = order.bu !== currentBU;
  const maxQuantity = order.remainingQuantity;

  // 處理數量變更
  const handleQuantityChange = (value: number) => {
    setError("");

    if (value < 1) {
      setError("消耗數量不能小於 1");
      setQuantity(1);
      return;
    }

    if (value > maxQuantity) {
      setError(`消耗數量不能超過剩餘數量 (${maxQuantity})`);
      setQuantity(maxQuantity);
      return;
    }

    setQuantity(value);
  };

  // 處理確認
  const handleConfirm = () => {
    if (quantity < 1 || quantity > maxQuantity) {
      setError("請輸入有效的消耗數量");
      return;
    }

    onConfirm(quantity, shouldTransfer);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 訂單摘要 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-50 mb-3">
          訂單摘要
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-amber-800 dark:text-amber-200">課程名稱</span>
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              {order.courseName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-800 dark:text-amber-200">剩餘數量</span>
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              {order.remainingQuantity} {order.quantityUnit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-800 dark:text-amber-200">訂單來源</span>
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              {order.bu} {isCrossBU && "(跨店訂單)"}
            </span>
          </div>
          {order.courseType === "shared" && (
            <div className="flex justify-between">
              <span className="text-amber-800 dark:text-amber-200">
                課程類型
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                共享課程
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 消耗數量輸入 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          消耗數量：
        </label>

        <div className="flex items-center gap-3">
          {/* 減少按鈕 */}
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="w-12 h-12 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200
                       rounded-xl hover:bg-stone-300 dark:hover:bg-stone-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors font-bold text-xl"
          >
            -
          </button>

          {/* 數量輸入框 */}
          <div className="flex-1">
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              min={1}
              max={maxQuantity}
              className="w-full px-4 py-3 text-center text-2xl font-bold
                         border border-stone-300 dark:border-stone-600
                         rounded-xl bg-white dark:bg-stone-800
                         text-stone-900 dark:text-stone-100
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-all duration-200"
            />
            <p className="text-xs text-center text-stone-500 dark:text-stone-400 mt-1">
              最多可輸入 {maxQuantity} {order.quantityUnit}
            </p>
          </div>

          {/* 增加按鈕 */}
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= maxQuantity}
            className="w-12 h-12 bg-amber-500 text-white
                       rounded-xl hover:bg-amber-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors font-bold text-xl"
          >
            +
          </button>
        </div>

        {/* 快速選擇按鈕 */}
        <div className="flex gap-2">
          {[1, 5, 10].map((value) => (
            <button
              key={value}
              onClick={() => handleQuantityChange(value)}
              disabled={value > maxQuantity}
              className="px-4 py-2 text-sm bg-stone-100 dark:bg-stone-800
                         text-stone-700 dark:text-stone-200
                         rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {value}
            </button>
          ))}
          <button
            onClick={() => handleQuantityChange(maxQuantity)}
            className="px-4 py-2 text-sm bg-stone-100 dark:bg-stone-800
                       text-stone-700 dark:text-stone-200
                       rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700
                       transition-colors"
          >
            全部 ({maxQuantity})
          </button>
        </div>

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

      {/* 訂單轉移選項 */}
      {isCrossBU && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldTransfer}
              onChange={(e) => setShouldTransfer(e.target.checked)}
              className="mt-1 w-5 h-5 text-amber-500 border-stone-300 dark:border-stone-600
                         rounded focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  自動轉移訂單
                </span>
                <span className="px-2 py-0.5 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                  建議
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                消耗完成後，此訂單將從 <strong>{order.bu}</strong> 轉移至{" "}
                <strong>{currentBU}</strong>，以便財務結算
              </p>
            </div>
          </label>
        </div>
      )}

      {/* 消耗後預覽 */}
      <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
        <h5 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
          消耗後狀態預覽
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600 dark:text-stone-400">
              本次消耗
            </span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              -{quantity} {order.quantityUnit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600 dark:text-stone-400">
              消耗後剩餘
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {order.remainingQuantity - quantity} {order.quantityUnit}
            </span>
          </div>
          {shouldTransfer && (
            <div className="pt-2 border-t border-stone-300 dark:border-stone-600">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">
                  訂單將轉移至 {currentBU}
                </span>
              </div>
            </div>
          )}
        </div>
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
          確認消耗
        </button>
      </div>
    </div>
  );
}
