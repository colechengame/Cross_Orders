"use client";

import { useState } from "react";
import type { BUCode, IUIState, IMemberSearchResult } from "./types";
import type { ISimplifiedOrder } from "./utils/mockData";
import BUSelector from "./components/BUSelector";
import MemberSearch from "./components/MemberSearch";
import MemberSearchResults from "./components/MemberSearchResults";
import OrderList from "./components/OrderList";
import OrderTransferConfirm from "./components/OrderTransferConfirm";
import { mockBUs, getMembersByBU, mockMemberLinks, getOrdersByMemberId } from "./utils/mockData";
import { searchMembers } from "./utils/searchUtils";

// 初始化 UI 狀態
const initialUIState: IUIState = {
  currentStep: 1,
  selectedBU: null,
  selectedMember: null,
  selectedOrder: null,
  consumptionValues: {},
  shouldTransferOrder: false,
  errorMessage: "",
  successMessage: null,
};

export default function V2HomePage() {
  const [uiState, setUIState] = useState<IUIState>(initialUIState);
  const [targetBU, setTargetBU] = useState<BUCode | null>(null); // 轉入門市（目標）
  const [searchResults, setSearchResults] = useState<IMemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [memberOrders, setMemberOrders] = useState<ISimplifiedOrder[]>([]);

  // 處理搜尋門市切換
  const handleBUChange = (bu: BUCode) => {
    setUIState((prev) => ({
      ...prev,
      selectedBU: bu,
      selectedMember: null,
    }));
    setSearchResults([]);
    setHasSearched(false);
  };

  // 處理轉入門市切換
  const handleTargetBUChange = (bu: BUCode) => {
    setTargetBU(bu);
  };

  // 處理搜尋
  const handleSearch = (keyword: string) => {
    if (!uiState.selectedBU) return;

    setIsSearching(true);
    setHasSearched(true);

    // 模擬異步搜尋
    setTimeout(() => {
      const members = getMembersByBU(uiState.selectedBU!);
      const results = searchMembers(members, {
        keyword,
        fuzzyMatch: true,
        minSimilarity: 60,
        memberLinks: mockMemberLinks,
      });

      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // 處理選擇會員
  const handleSelectMember = (result: IMemberSearchResult) => {
    setUIState((prev) => ({
      ...prev,
      selectedMember: result.member,
      currentStep: 2,
    }));

    // 載入會員的訂單
    const orders = getOrdersByMemberId(result.member.id);
    setMemberOrders(orders);
  };

  // 處理選擇訂單
  const handleSelectOrder = (order: ISimplifiedOrder) => {
    setUIState((prev) => ({
      ...prev,
      selectedOrder: order as any, // 臨時轉換，因為 IUIState 中的 selectedOrder 類型需要更新
      currentStep: 3,
    }));
  };

  // 處理訂單轉移確認
  const handleTransferConfirm = (transferReason: string) => {
    if (!uiState.selectedOrder || !uiState.selectedMember || !targetBU) return;

    // 更新 UI 狀態
    setUIState((prev) => ({
      ...prev,
      shouldTransferOrder: true,
      currentStep: 4,
      successMessage: `訂單已從 ${uiState.selectedOrder!.bu} 轉移至 ${targetBU}`,
    }));

    // 模擬訂單轉移處理
    console.log("執行訂單轉移:", {
      orderId: uiState.selectedOrder.orderId,
      orderNumber: uiState.selectedOrder.orderNumber,
      courseName: uiState.selectedOrder.courseName,
      from: uiState.selectedOrder.bu,
      to: targetBU,
      reason: transferReason,
      memberName: uiState.selectedMember.name,
      memberPhone: uiState.selectedMember.phone,
      timestamp: new Date().toISOString(),
    });
  };

  // 處理取消轉移
  const handleTransferCancel = () => {
    setUIState((prev) => ({
      ...prev,
      selectedOrder: null,
      currentStep: 2,
    }));
  };

  // 處理重新開始
  const handleRestart = () => {
    setUIState(initialUIState);
    setTargetBU(null);
    setSearchResults([]);
    setMemberOrders([]);
    setHasSearched(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
                  跨店訂單轉移系統
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                  B 版
                </span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 mb-3">
                快速轉移跨店訂單，實際消耗回各系統操作
              </p>

              {/* 版本差異說明 */}
              <div className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400 bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">與 A 版的差異：</p>
                  <ul className="space-y-0.5 text-blue-600 dark:text-blue-400">
                    <li>• <strong>A 版</strong>：消耗方發起請求 → 銷售方審核 → 轉移訂單（4-5 步驟）</li>
                    <li>• <strong>B 版</strong>：直接搜尋 → 選擇訂單 → 轉移完成（3 步驟，簡化 90%）</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 版本切換按鈕 */}
            <div className="flex gap-3 ml-6">
              <a
                href="/"
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                切換到 A 版
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：搜尋區域 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 進度指示器 */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-5 border border-stone-200 dark:border-stone-700">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">
              操作流程
            </h3>
            <div className="space-y-3">
              <StepIndicator
                number={1}
                title="搜尋會員"
                active={uiState.currentStep === 1}
                completed={uiState.currentStep > 1}
              />
              <StepIndicator
                number={2}
                title="選擇訂單"
                active={uiState.currentStep === 2}
                completed={uiState.currentStep > 2}
                disabled={uiState.currentStep < 2}
              />
              <StepIndicator
                number={3}
                title="轉移訂單"
                active={uiState.currentStep === 3}
                completed={uiState.currentStep > 3}
                disabled={uiState.currentStep < 3}
              />
              <StepIndicator
                number={4}
                title="完成"
                active={uiState.currentStep === 4}
                completed={false}
                disabled={uiState.currentStep < 4}
              />
            </div>
          </div>

          {/* BU 切換搜尋區域 */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-5 border border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">
              Step 1: 搜尋會員
            </h3>

            <div className="space-y-4">
              {/* 搜尋門市選擇器 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  搜尋門市：
                </label>
                <BUSelector
                  bus={mockBUs}
                  selectedBU={uiState.selectedBU}
                  onBUChange={handleBUChange}
                  showLabel={false}
                />
              </div>

              {/* 轉入門市選擇器 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  轉入門市：<span className="text-red-500">*</span>
                </label>
                <select
                  value={targetBU || ""}
                  onChange={(e) => handleTargetBUChange(e.target.value as BUCode)}
                  className="w-full px-4 py-3 text-base border border-stone-300 dark:border-stone-600
                             rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                             transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500
                             shadow-sm hover:shadow-md"
                >
                  <option value="" disabled>
                    請選擇轉入門市
                  </option>
                  {mockBUs.map((bu) => (
                    <option key={bu.code} value={bu.code}>
                      {bu.displayName}
                    </option>
                  ))}
                </select>
                {targetBU && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    訂單將轉移至：
                    {mockBUs.find((bu) => bu.code === targetBU)?.name || targetBU}
                  </p>
                )}
              </div>

              {/* 會員搜尋 */}
              <MemberSearch
                selectedBU={uiState.selectedBU}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            </div>
          </div>

          {/* 功能特點說明 */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-xl shadow-lg p-5 border border-amber-200 dark:border-amber-800">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-50 mb-3">
              ✨ B 版特點
            </h4>
            <ul className="space-y-2 text-xs text-amber-800 dark:text-amber-200">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>跨店會員智能搜尋</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>快速訂單轉移作業</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>轉移原因記錄保存</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>實際消耗回原系統</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 右側：搜尋結果區域 */}
        <div className="lg:col-span-2">
          {/* 搜尋結果 */}
          {hasSearched && (
            <MemberSearchResults
              results={searchResults}
              keyword=""
              onSelectMember={handleSelectMember}
            />
          )}

          {/* 選中的會員和訂單列表 */}
          {uiState.selectedMember && (
            <div className="mt-6 space-y-6">
              {/* 會員資訊卡片 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-5 border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                      已選擇會員
                    </p>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                      {uiState.selectedMember.name}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                      {uiState.selectedMember.phone} • {uiState.selectedMember.mainStore}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUIState((prev) => ({
                        ...prev,
                        selectedMember: null,
                        selectedOrder: null,
                        currentStep: 1,
                      }));
                      setMemberOrders([]);
                    }}
                    className="px-4 py-2 text-sm bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    重新選擇
                  </button>
                </div>
              </div>

              {/* Step 2: 訂單列表 */}
              {uiState.currentStep === 2 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">
                    Step 2: 選擇訂單
                  </h3>
                  <OrderList
                    orders={memberOrders}
                    currentBU={targetBU || uiState.selectedBU!}
                    onSelectOrder={handleSelectOrder}
                  />
                </div>
              )}

              {/* Step 3: 訂單轉移確認 */}
              {uiState.currentStep === 3 && uiState.selectedOrder && (
                <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-6">
                    Step 3: 確認訂單轉移
                  </h3>
                  <OrderTransferConfirm
                    order={uiState.selectedOrder}
                    currentBU={targetBU || uiState.selectedBU!}
                    onConfirm={handleTransferConfirm}
                    onCancel={handleTransferCancel}
                  />
                </div>
              )}

              {/* Step 4: 完成 */}
              {uiState.currentStep === 4 && uiState.successMessage && (
                <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 border border-stone-200 dark:border-stone-700">
                  <div className="text-center">
                    {/* 成功圖示 */}
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* 成功訊息 */}
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                      訂單轉移成功
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400 mb-6">
                      {uiState.successMessage}
                    </p>

                    {/* 訂單轉移資訊 */}
                    {uiState.shouldTransferOrder &&
                      uiState.selectedOrder &&
                      targetBU &&
                      uiState.selectedOrder.bu !== targetBU && (
                        <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-center gap-4 text-blue-700 dark:text-blue-300 mb-3">
                            <span className="px-4 py-2 bg-blue-200 dark:bg-blue-800 rounded-lg font-bold">
                              {uiState.selectedOrder.bu}
                            </span>
                            <svg
                              className="w-8 h-8 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="px-4 py-2 bg-green-200 dark:bg-green-800 rounded-lg font-bold">
                              {targetBU}
                            </span>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                              訂單轉移成功!
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              • 訂單歸屬權已轉移至 {targetBU}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              • 轉移記錄已保存,可用於財務結算
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                              ⚠️ 實際課程消耗請在 {targetBU} 系統中進行操作
                            </p>
                          </div>
                        </div>
                      )}

                    {/* 操作詳情 */}
                    <div className="mb-6 p-4 bg-stone-100 dark:bg-stone-800 rounded-xl text-left">
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                        轉移詳情
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-stone-600 dark:text-stone-400">
                            會員姓名
                          </span>
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {uiState.selectedMember?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600 dark:text-stone-400">
                            會員電話
                          </span>
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {uiState.selectedMember?.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600 dark:text-stone-400">
                            課程名稱
                          </span>
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {uiState.selectedOrder?.courseName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600 dark:text-stone-400">
                            剩餘數量
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {uiState.selectedOrder?.remainingQuantity}{" "}
                            {uiState.selectedOrder?.quantityUnit}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-700">
                          <span className="text-stone-600 dark:text-stone-400">
                            轉出門市
                          </span>
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {uiState.selectedOrder?.bu}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600 dark:text-stone-400">
                            轉入門市
                          </span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {targetBU}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleRestart}
                        className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl
                                   hover:bg-amber-600 transition-colors font-medium
                                   shadow-md hover:shadow-lg"
                      >
                        處理下一筆
                      </button>
                      <button
                        onClick={() => {
                          // 可以導向其他頁面，例如轉移記錄
                          console.log("查看轉移記錄");
                        }}
                        className="flex-1 px-6 py-3 bg-stone-200 dark:bg-stone-700
                                   text-stone-700 dark:text-stone-200 rounded-xl
                                   hover:bg-stone-300 dark:hover:bg-stone-600
                                   transition-colors font-medium"
                      >
                        查看轉移記錄
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 初始狀態提示 */}
          {!hasSearched && !uiState.selectedMember && (
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
              <svg
                className="mx-auto h-16 w-16 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                開始搜尋會員
              </h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                請選擇搜尋門市並輸入會員姓名或手機號碼
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 步驟指示器組件
// ============================================================================

interface StepIndicatorProps {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
  disabled?: boolean;
}

function StepIndicator({
  number,
  title,
  active,
  completed,
  disabled = false,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
        flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
        transition-all duration-200
        ${completed ? "bg-green-500 text-white" : active ? "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900" : disabled ? "bg-stone-200 dark:bg-stone-700 text-stone-400" : "bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-400"}
      `}
      >
        {completed ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          active
            ? "text-amber-700 dark:text-amber-300"
            : disabled
            ? "text-stone-400"
            : "text-stone-600 dark:text-stone-400"
        }`}
      >
        {title}
      </span>
    </div>
  );
}
