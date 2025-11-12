/**
 * 訂單列表組件
 * 顯示選中會員的所有訂單，支持跨 BU 訂單篩選
 */

import type { BUCode } from "../types";
import type { ISimplifiedOrder } from "../utils/mockData";

interface OrderListProps {
  orders: ISimplifiedOrder[];
  currentBU: BUCode;
  onSelectOrder: (order: ISimplifiedOrder) => void;
  className?: string;
}

export default function OrderList({
  orders,
  currentBU,
  onSelectOrder,
  className = "",
}: OrderListProps) {
  // 按照訂單狀態和可用性分組
  const validOrders = orders.filter(
    (order) => order.status === "active" && order.remainingQuantity > 0
  );

  if (orders.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 border border-stone-200 dark:border-stone-700 ${className}`}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-stone-900 dark:text-stone-100">
            此會員尚無訂單
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            請先為會員建立訂單
          </p>
        </div>
      </div>
    );
  }

  if (validOrders.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 border border-stone-200 dark:border-stone-700 ${className}`}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-stone-900 dark:text-stone-100">
            無可用訂單
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            所有訂單已消耗完畢或已過期
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          可用訂單 ({validOrders.length})
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          點擊訂單卡片以選擇
        </p>
      </div>

      <div className="space-y-3">
        {validOrders.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            currentBU={currentBU}
            onClick={() => onSelectOrder(order)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 訂單卡片組件
// ============================================================================

interface OrderCardProps {
  order: ISimplifiedOrder;
  currentBU: BUCode;
  onClick: () => void;
}

function OrderCard({ order, currentBU, onClick }: OrderCardProps) {
  const isCrossBU = order.bu !== currentBU;
  const isSharedCourse = order.courseType === "shared";

  // 計算使用百分比
  const usagePercentage =
    ((order.totalQuantity - order.remainingQuantity) / order.totalQuantity) *
    100;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-stone-800 rounded-xl shadow-md hover:shadow-xl
                 border border-stone-200 dark:border-stone-700 p-5
                 transition-all duration-200 hover:scale-[1.02] hover:border-amber-400 dark:hover:border-amber-500
                 text-left group"
    >
      {/* 頭部：課程名稱和標籤 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            {order.courseName}
          </h4>

          <div className="flex flex-wrap gap-2">
            {/* BU 標籤 */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCrossBU
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              }`}
            >
              {isCrossBU ? `跨店 (${order.bu})` : `本店 (${order.bu})`}
            </span>

            {/* 課程類型標籤 */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isSharedCourse
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              }`}
            >
              {isSharedCourse ? "共享課程" : "專屬課程"}
            </span>

            {/* 有效期標籤 */}
            {order.validityDate && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                效期至 {new Date(order.validityDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* 選擇箭頭 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-3">
          <svg
            className="w-6 h-6 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* 訂單詳情 */}
      <div className="space-y-3">
        {/* 剩餘數量 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              剩餘數量
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {order.remainingQuantity} / {order.totalQuantity}{" "}
              {order.quantityUnit}
            </span>
          </div>

          {/* 進度條 */}
          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${100 - usagePercentage}%` }}
            />
          </div>
        </div>

        {/* 訂單資訊 */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              訂單編號
            </p>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {order.orderId}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              購買日期
            </p>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {new Date(order.purchaseDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* 跨店提示 */}
        {isCrossBU && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  跨店消耗提示
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  此訂單來自 {order.bu}，消耗後將自動轉移至 {currentBU}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
