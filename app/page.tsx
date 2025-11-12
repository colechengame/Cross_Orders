"use client";

import React, { useState, FormEvent } from "react";
import ThemeToggle from "./components/ThemeToggle";

/** 會員歷購訂單中，每個課程的型別 */
interface IOrderItem {
  name: string;
  total: number;
  used: number;
  remaining: number;
  shared: boolean;
}

/** 會員歷購訂單 */
interface IOrder {
  id: string;
  store: string;
  date: string;
  items: IOrderItem[];
  status: string; // '有效' 等
}

/** 會員資料 (mock 用) */
interface IMemberData {
  name: string;
  phone: string;
  mainStore: string;
  relatedStores: string[];
  orders: IOrder[];
}

/** 消耗方 Step 1 搜尋結果狀態 */
type MemberStatus = null | "found" | "notFound";

/** 跨轉單 Request (銷售方 / 審核) */
interface ITransferRequest {
  id: string;
  requestTime: string;  // 請求時間
  status: "待審核" | "已審核" | "已拒絕" | "已取消" | "已完成";
  consumer: string;     // 消耗方
  member: string;       // 會員名稱
  phone: string;        // 會員手機
  orderId: string;      // 對應哪個銷售訂單
  course: string;       // 消耗課程 (文字說明)
  amount: number;       // 總消耗堂數
  remainingAfter: number; 
  requestNote: string;  
  approveTime?: string;
  approveNote?: string;
  approver?: string;
}

/** 消耗方歷史 (已完成或發起中) 跨轉單 */
interface ICompletedTransfer {
  id: string;
  date: string;         // 發起或完成時間 (顯示用)
  status: "待審核" | "已審核" | "已拒絕" | "已取消" | "已完成";
  consumer: string;     // 消耗方
  seller: string;       // 銷售方
  member: string;
  orderId: string;
  course: string;
  amount: number;
  canCancel: boolean;
}

/** 用於記錄課程消耗量的映射 (key=課程名稱, value=消耗堂數) */
type ConsumptionMap = Record<string, number>;

/** 審核按鈕的類型 */
type ApprovalType = "approve" | "reject" | "";

/** 範例主元件 */
const IntegratedCrossUnitTransferSystem: React.FC = () => {
  // 角色切換: 'consumer' or 'seller'
  const [interfaceType, setInterfaceType] = useState<"consumer" | "seller">("consumer");

  // ---------- 消耗方狀態 ---------- //
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchType, setSearchType] = useState<"phone" | "name">("phone");
  const [searchValue, setSearchValue] = useState<string>("");
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(null);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [consumptionValues, setConsumptionValues] = useState<ConsumptionMap>({});
  const [showTransferHistory, setShowTransferHistory] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [transferToCancel, setTransferToCancel] = useState<ICompletedTransfer | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [userDepartment, setUserDepartment] = useState<string>("板橋醫美");

  // 消耗方 - 已完成 / 歷史列表
  const [completedTransfers, setCompletedTransfers] = useState<ICompletedTransfer[]>([
    {
      id: "CTR-20240308-001",
      date: "2024-03-08 15:22",
      status: "已完成",
      consumer: "愛美肌",
      seller: "板橋醫美",
      member: "王小明",
      orderId: "SO-20240301-025",
      course: "美白護理課程",
      amount: 2,
      canCancel: true,
    },
    {
      id: "CTR-20240307-003",
      date: "2024-03-07 10:35",
      status: "已完成",
      consumer: "愛美肌",
      seller: "漾澤",
      member: "陳大明",
      orderId: "SO-20240225-098",
      course: "肌膚緊緻課程",
      amount: 1,
      canCancel: false,
    },
  ]);

  // ---------- 銷售方狀態 ---------- //
  const [transferRequests, setTransferRequests] = useState<ITransferRequest[]>([
    {
      id: "CTR-20240309-001",
      requestTime: "2024-03-09 10:15",
      status: "待審核",
      consumer: "愛美肌",
      member: "王小明",
      phone: "0912345678",
      orderId: "SO-20240210-042",
      course: "保濕護理課程",
      amount: 1,
      remainingAfter: 2,
      requestNote: "客戶居住地靠近愛美肌分店，要求在此進行療程",
    },
    {
      id: "CTR-20240309-002",
      requestTime: "2024-03-09 11:30",
      status: "待審核",
      consumer: "漾澤",
      member: "李小華",
      phone: "0987654321",
      orderId: "SO-20240301-015",
      course: "肌膚緊緻課程",
      amount: 2,
      remainingAfter: 3,
      requestNote: "客戶臨時需求，請盡快審核",
    },
    {
      id: "CTR-20240308-005",
      requestTime: "2024-03-08 16:45",
      status: "已審核",
      consumer: "愛美肌",
      member: "陳美麗",
      phone: "0922334455",
      orderId: "SO-20240225-033",
      course: "美白調理課程",
      amount: 1,
      remainingAfter: 4,
      requestNote: "",
      approveTime: "2024-03-08 17:20",
      approveNote: "已確認課程內容與剩餘次數",
      approver: "王經理",
    },
  ]);

  const [approvalHistory, setApprovalHistory] = useState<ITransferRequest[]>([
    {
      id: "CTR-20240308-001",
      requestTime: "2024-03-08 09:10",
      status: "已審核",
      consumer: "漾澤",
      member: "林小花",
      phone: "0912000111",
      orderId: "SO-20240220-019",
      course: "保濕護理課程",
      amount: 1,
      remainingAfter: 9,
      requestNote: "",
      approveTime: "2024-03-08 10:05",
      approveNote: "已電話確認客戶需求",
      approver: "王經理",
    },
    {
      id: "CTR-20240307-003",
      requestTime: "2024-03-07 14:20",
      status: "已拒絕",
      consumer: "愛美肌",
      member: "張大明",
      phone: "0988111222",
      orderId: "SO-20240215-027",
      course: "美白調理課程",
      amount: 3,
      remainingAfter: 5,
      requestNote: "因剩餘次數不足，已拒絕",
      approveTime: "2024-03-07 15:30",
      approveNote: "已與消耗方溝通",
      approver: "李主管",
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<ITransferRequest | null>(null);
  const [approvalType, setApprovalType] = useState<ApprovalType>("");
  const [approvalNote, setApprovalNote] = useState<string>("");
  const [showApprovalDialog, setShowApprovalDialog] = useState<boolean>(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"待審核" | "已審核" | "已拒絕" | "all">("待審核");

  // ---------- 共同狀態 ---------- //
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ---------- 模擬會員資料 ---------- //
  const mockMemberData: IMemberData = {
    name: "王小明",
    phone: "0912345678",
    mainStore: "愛美肌",
    relatedStores: ["板橋醫美", "漾澤"],
    orders: [
      {
        id: "SO-20240305-001",
        store: "愛美肌",
        date: "2024-03-05",
        items: [
          { name: "肌膚緊緻課程", total: 10, used: 3, remaining: 7, shared: true },
        ],
        status: "有效",
      },
      {
        id: "SO-20240210-042",
        store: "板橋醫美",
        date: "2024-02-10",
        items: [
          { name: "保濕護理課程", total: 5, used: 2, remaining: 3, shared: true },
          { name: "美白調理課程", total: 8, used: 0, remaining: 8, shared: false },
        ],
        status: "有效",
      },
    ],
  };

  // =========================================================================
  // (1) 切換角色
  // =========================================================================
  const switchUserRole = (): void => {
    if (interfaceType === "consumer") {
      setInterfaceType("seller");
    } else {
      setInterfaceType("consumer");
      // 重置銷售方顯示狀態
      setShowHistory(false);
      setSelectedRequest(null);
    }

    // 如果原先是 seller -> 轉成 consumer，需要重置相關
    if (interfaceType === "seller") {
      setCurrentStep(1);
      setSearchValue("");
      setSelectedOrder(null);
      setConsumptionValues({});
      setShowTransferHistory(false);
    }
  };

  // =========================================================================
  // (2) 消耗方操作：查詢會員
  // =========================================================================
  const handleSearch = (): void => {
    if (!searchValue.trim()) {
      setErrorMessage("請輸入查詢內容");
      return;
    }
    if (searchType === "phone" && !/^\d{10}$/.test(searchValue)) {
      setErrorMessage("手機號碼格式不正確，請輸入10位數字");
      return;
    }

    // 模擬查詢結果
    if (
      searchValue === "0912345678" ||
      searchValue === "王小明" ||
      searchValue.length >= 5
    ) {
      setMemberStatus("found");
      setCurrentStep(2);
    } else {
      setMemberStatus("notFound");
    }

    setErrorMessage("");
  };

  // =========================================================================
  // (3) 消耗方操作：選擇訂單
  // =========================================================================
  const handleSelectOrder = (order: IOrder): void => {
    const hasSharedCourses = order.items.some((item) => item.shared);
    if (!hasSharedCourses) {
      setErrorMessage("所選訂單不包含任何共用課程，無法進行跨轉");
      return;
    }
    const initialValues: ConsumptionMap = {};
    order.items.forEach((item) => {
      if (item.shared) {
        initialValues[item.name] = 0;
      }
    });
    setConsumptionValues(initialValues);
    setSelectedOrder(order);
    setCurrentStep(3);
    setErrorMessage("");
  };

  // =========================================================================
  // (4) 消耗方操作：填寫消耗數量
  // =========================================================================
  const handleConsumptionChange = (courseName: string, value: number): void => {
    setConsumptionValues((prev) => ({
      ...prev,
      [courseName]: value,
    }));
  };

  // =========================================================================
  // (5) 消耗方操作：發起跨轉單
  // =========================================================================
  const handleSubmitRequest = (): void => {
    // 至少要有一個課程消耗
    const hasSelected = Object.values(consumptionValues).some((val) => val > 0);
    if (!hasSelected) {
      setErrorMessage("請至少選擇一項課程進行消耗");
      return;
    }
    if (!selectedOrder) return;

    // 檢查數量是否超過剩餘
    let isValid = true;
    let errorMsg = "";
    for (const item of selectedOrder.items) {
      if (item.shared) {
        const needed = consumptionValues[item.name] || 0;
        if (needed > item.remaining) {
          isValid = false;
          errorMsg = `${item.name} 的消耗數量不能超過剩餘數量 ${item.remaining}`;
          break;
        }
      }
    }
    if (!isValid) {
      setErrorMessage(errorMsg);
      return;
    }

    const now = new Date();
    const nowStr = now.toISOString().slice(0, 16).replace("T", " ");

    // 建立新跨轉資料
    // (1) 同時存進 "消耗方歷史" (ICompletedTransfer) 與 "銷售方待審核" (ITransferRequest) 兩個 state
    // 注意: ITransferRequest 跟 ICompletedTransfer 屬性不完全相同，我們做適當轉換
    const totalConsumption = Object.values(consumptionValues).reduce((sum, val) => sum + val, 0);

    const newId = `CTR-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;

    // 給消耗方歷史用
    const newCompleted: ICompletedTransfer = {
      id: newId,
      date: nowStr,
      status: "待審核",
      consumer: userDepartment,
      seller: selectedOrder.store,
      member: mockMemberData.name,
      orderId: selectedOrder.id,
      course: Object.entries(consumptionValues)
        .filter(([_, v]) => v > 0)
        .map(([k, v]) => `${k} x ${v}`)
        .join(", "),
      amount: totalConsumption,
      canCancel: true,
    };

    // 給銷售方審核用
    const newRequest: ITransferRequest = {
      id: newId,
      requestTime: nowStr,
      status: "待審核",
      consumer: userDepartment,
      member: mockMemberData.name,
      phone: mockMemberData.phone,
      orderId: selectedOrder.id,
      course: newCompleted.course,
      amount: totalConsumption,
      remainingAfter:
        selectedOrder.items[0].remaining -
        (consumptionValues[selectedOrder.items[0].name] || 0),
      requestNote: "客戶要求在本店進行療程",
    };

    // 更新到消耗方歷史
    setCompletedTransfers((prev) => [newCompleted, ...prev]);
    // 更新到銷售方待審核清單
    setTransferRequests((prev) => [newRequest, ...prev]);

    setCurrentStep(4);
    setErrorMessage("");
  };

  // =========================================================================
  // (6) 消耗方操作：取消跨轉單
  // =========================================================================
  const handleCancelTransfer = (transfer: ICompletedTransfer): void => {
    setTransferToCancel(transfer);
    setShowCancelConfirm(true);
  };

  const confirmCancelTransfer = (event: FormEvent): void => {
    event.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMessage("請提供取消原因");
      return;
    }
    if (!transferToCancel) return;

    // 1) 更新 completedTransfers
    setCompletedTransfers((prev) =>
      prev.map((item) =>
        item.id === transferToCancel.id
          ? { ...item, status: "已取消", canCancel: false }
          : item
      )
    );

    // 2) 更新 transferRequests 同步狀態
    setTransferRequests((prev) =>
      prev.map((item) =>
        item.id === transferToCancel.id ? { ...item, status: "已取消" } : item
      )
    );

    setErrorMessage("");
    setShowCancelConfirm(false);
    setTransferToCancel(null);
    setCancelReason("");
  };

  // =========================================================================
  // (7) 銷售方操作：篩選 + 審核
  // =========================================================================
  const filteredRequests = transferRequests.filter((req) =>
    filterStatus === "all" ? true : req.status === filterStatus
  );

  const handleApprove = (request: ITransferRequest): void => {
    setSelectedRequest(request);
    setApprovalType("approve");
    setApprovalNote("");
    setShowApprovalDialog(true);
  };

  const handleReject = (request: ITransferRequest): void => {
    setSelectedRequest(request);
    setApprovalType("reject");
    setApprovalNote("");
    setShowApprovalDialog(true);
  };

  const submitApproval = (): void => {
    if (!approvalNote.trim()) {
      setErrorMessage("請填寫審核備註");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmApproval = (): void => {
    if (!selectedRequest) return; // 容錯
    const nowStr = new Date().toLocaleString("zh-TW");
    const newStatus = approvalType === "approve" ? "已審核" : "已拒絕";

    // 1) 更新 transferRequests
    const updated = transferRequests.map((req) =>
      req.id === selectedRequest.id
        ? {
            ...req,
            status: newStatus as "待審核" | "已審核" | "已拒絕" | "已取消" | "已完成",
            approveTime: nowStr,
            approveNote: approvalNote,
            approver: "王經理",
          }
        : req
    );
    setTransferRequests(updated);

    // 2) 新增到審核歷史
    const historyItem: ITransferRequest = {
      ...selectedRequest,
      status: newStatus,
      approveTime: nowStr,
      approveNote: approvalNote,
      approver: "王經理",
    };
    setApprovalHistory((prev) => [historyItem, ...prev]);

    // 3) 同步更新 completedTransfers
    setCompletedTransfers((prev) =>
      prev.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, status: approvalType === "approve" ? "已完成" : "已拒絕" }
          : item
      )
    );

    setShowApprovalDialog(false);
    setShowConfirmation(false);
    setSelectedRequest(null);
    setErrorMessage("");
    setApprovalType("");
    setApprovalNote("");
  };

  const viewDetails = (request: ITransferRequest): void => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  // =========================================================================
  // 以下開始：完整 JSX
  // =========================================================================
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 p-4 transition-colors">
      {/* Header */}
      <header className="bg-amber-50 dark:bg-stone-800 shadow-lg rounded-lg mb-6 p-4 transition-colors border border-stone-200 dark:border-stone-600">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-50">
                {interfaceType === "consumer" ? "跨轉單處理系統" : "跨轉單審核系統"}
              </h1>
              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
                A 版
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-100 mb-2">
              {interfaceType === "consumer"
                ? `消耗方操作介面 - ${userDepartment} (接收跨轉單部門)`
                : `銷售方操作介面 - 愛美肌 (課程銷售部門)`}
            </p>

            {/* 版本說明 */}
            <div className="flex items-start gap-2 text-xs bg-amber-100 dark:bg-amber-950 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-amber-800 dark:text-amber-200">
                完整審核流程，適用於需要銷售方確認的場景。<strong className="ml-1">想要更快速的流程？試試 B 版！</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* 版本切換按鈕 */}
            <a
              href="/v2"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              切換到 B 版
            </a>

            <button
              onClick={switchUserRole}
              className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-md text-sm hover:bg-amber-300 dark:hover:bg-amber-700 flex items-center transition-colors"
            >
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  interfaceType === "consumer" ? "bg-green-500" : "bg-amber-600 dark:bg-amber-700"
                }`}
              ></span>
              {interfaceType === "consumer" ? "切換為銷售方" : "切換為消耗方"}
            </button>

            {interfaceType === "consumer" && (
              <button
                onClick={() => setShowTransferHistory(!showTransferHistory)}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-md text-sm hover:bg-orange-200 dark:hover:bg-orange-800 flex items-center transition-colors"
              >
                歷史記錄
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 錯誤訊息區塊 */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* ====================== 消耗方介面 ====================== */}
      {interfaceType === "consumer" && (
        <main className="bg-amber-50 dark:bg-stone-800 p-6 rounded-lg shadow-lg transition-colors border border-stone-200 dark:border-stone-600">
          {/* 進度條 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 1 ? "text-amber-700 dark:text-amber-100" : "text-stone-500 dark:text-stone-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1
                      ? "border-amber-600 dark:border-amber-400 bg-amber-100 dark:bg-amber-900"
                      : "border-stone-500 dark:border-stone-300"
                  }`}
                >
                  1
                </div>
                <span className="mt-1 text-sm text-amber-800 dark:text-amber-200">會員查詢</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 2 ? "bg-amber-600" : "bg-stone-400 dark:bg-stone-600"
                }`}
              ></div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 2 ? "text-amber-700 dark:text-amber-100" : "text-stone-500 dark:text-stone-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2
                      ? "border-amber-600 dark:border-amber-400 bg-amber-100 dark:bg-amber-900"
                      : "border-stone-500 dark:border-stone-300"
                  }`}
                >
                  2
                </div>
                <span className="mt-1 text-sm text-amber-800 dark:text-amber-200">歷購確認</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 3 ? "bg-amber-600" : "bg-stone-400 dark:bg-stone-600"
                }`}
              ></div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 3 ? "text-amber-700 dark:text-amber-100" : "text-stone-500 dark:text-stone-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3
                      ? "border-amber-600 dark:border-amber-400 bg-amber-100 dark:bg-amber-900"
                      : "border-stone-500 dark:border-stone-300"
                  }`}
                >
                  3
                </div>
                <span className="mt-1 text-sm text-amber-800 dark:text-amber-200">課程消耗</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 4 ? "bg-amber-600" : "bg-stone-400 dark:bg-stone-600"
                }`}
              ></div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 4 ? "text-amber-700 dark:text-amber-100" : "text-stone-500 dark:text-stone-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 4
                      ? "border-amber-600 dark:border-amber-400 bg-amber-100 dark:bg-amber-900"
                      : "border-stone-500 dark:border-stone-300"
                  }`}
                >
                  4
                </div>
                <span className="mt-1 text-sm text-amber-800 dark:text-amber-200">完成跨轉</span>
              </div>
            </div>
          </div>

          {/* Step 1: 查詢會員 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-amber-900 dark:text-amber-50">查詢會員資料</h2>
              <div className="flex mb-4">
                <div
                  className={`px-4 py-2 cursor-pointer rounded-l-md ${
                    searchType === "phone"
                      ? "bg-amber-600 dark:bg-amber-700 text-white"
                      : "bg-gray-200 dark:bg-stone-700 dark:text-gray-200"
                  }`}
                  onClick={() => setSearchType("phone")}
                >
                  手機號碼
                </div>
                <div
                  className={`px-4 py-2 cursor-pointer rounded-r-md ${
                    searchType === "name"
                      ? "bg-amber-600 dark:bg-amber-700 text-white"
                      : "bg-gray-200 dark:bg-stone-700 dark:text-gray-200"
                  }`}
                  onClick={() => setSearchType("name")}
                >
                  會員姓名
                </div>
              </div>

              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder={
                    searchType === "phone"
                      ? "請輸入會員手機號碼 (測試輸入0912345678)"
                      : "請輸入會員姓名 (測試輸入王小明)"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1 p-2 border border-stone-300 dark:border-stone-600 dark:border-stone-600 bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-100 text-amber-900 dark:text-amber-50 dark:text-white rounded-l-md"
                />
                <button
                  onClick={handleSearch}
                  className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 rounded-r-md hover:bg-amber-600"
                >
                  查詢
                </button>
              </div>

              {memberStatus === "notFound" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    查無會員資料，請確認輸入資訊是否正確
                  </p>
                </div>
              )}

              <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  提示：您可以使用 "0912345678" 或 "王小明" 來測試成功的查詢結果
                </p>
              </div>
            </div>
          )}

          {/* Step 2: 歷購訂單 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                確認銷售訂單歸屬門市與歷購內容
              </h2>
              <div className="bg-amber-100 dark:bg-stone-700 border border-amber-200 dark:border-stone-600 rounded-md p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-amber-900 dark:text-amber-50">會員資料</h3>
                    <p className="text-sm mt-1 text-amber-800 dark:text-amber-100">姓名: {mockMemberData.name}</p>
                    <p className="text-sm text-amber-800 dark:text-amber-100">手機: {mockMemberData.phone}</p>
                    <p className="text-sm text-amber-800 dark:text-amber-100">
                      主要門市: {mockMemberData.mainStore}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-800 px-3 py-1 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-100">已綁定跨體系帳號</p>
                  </div>
                </div>
              </div>
              <h3 className="font-medium mb-2 text-amber-900 dark:text-amber-50">歷購銷售訂單列表</h3>
              <p className="text-sm text-amber-700 dark:text-amber-200 mb-4">
                請選擇要進行消耗的訂單
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-stone-300 dark:border-stone-600">
                  <thead className="bg-stone-200 dark:bg-stone-600">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        訂單編號
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        所屬門市
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        購買日期
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        狀態
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMemberData.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100">
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">{order.id}</td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">{order.store}</td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">{order.date}</td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          <button
                            onClick={() => handleSelectOrder(order)}
                            className="px-3 py-1 bg-amber-600 dark:bg-amber-700 text-white rounded-md text-xs hover:bg-amber-600"
                          >
                            選擇此訂單
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
                >
                  返回
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 填寫消耗數量 */}
          {currentStep === 3 && selectedOrder && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-amber-900 dark:text-amber-50">課程消耗操作</h2>
              <div className="bg-amber-100 dark:bg-stone-700 border border-amber-200 dark:border-stone-600 rounded-md p-4 mb-6">
                <h3 className="font-medium text-amber-900 dark:text-amber-50">訂單資訊</h3>
                <p className="text-sm mt-1 text-amber-800 dark:text-amber-100">訂單編號: {selectedOrder.id}</p>
                <p className="text-sm text-amber-800 dark:text-amber-100">所屬門市: {selectedOrder.store}</p>
                <p className="text-sm text-amber-800 dark:text-amber-100">購買日期: {selectedOrder.date}</p>
                <p className="text-sm text-amber-800 dark:text-amber-100">會員: {mockMemberData.name}</p>
              </div>
              <h3 className="font-medium mb-2 text-amber-900 dark:text-amber-50">課程項目</h3>
              <p className="text-sm text-amber-700 dark:text-amber-200 mb-4">
                請選擇要消耗的課程項目與數量
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-stone-300 dark:border-stone-600">
                  <thead className="bg-stone-200 dark:bg-stone-600">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        課程名稱
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        總堂數
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        已使用
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        剩餘
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        共用課程
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm text-amber-900 dark:text-amber-100">
                        消耗數量
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          !item.shared ? "bg-stone-200 dark:bg-stone-600" : "hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
                        }
                      >
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.total}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.used}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.remaining}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.shared ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-xs">
                              是
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-full text-xs">
                              否
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-amber-900 dark:text-amber-100">
                          {item.shared ? (
                            <input
                              type="number"
                              min={0}
                              max={item.remaining}
                              value={consumptionValues[item.name] || 0}
                              onChange={(e) =>
                                handleConsumptionChange(
                                  item.name,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 p-1 border border-stone-300 dark:border-stone-600 rounded-md"
                            />
                          ) : (
                            <span className="text-stone-500 dark:text-stone-300">不可跨轉</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md mr-2 hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-md hover:bg-amber-600"
                >
                  發起跨轉單
                </button>
              </div>
            </div>
          )}

          {/* Step 4: 完成跨轉 */}
          {currentStep === 4 && (
            <div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">跨轉單已成功發起</h2>
                <p className="text-amber-700 dark:text-amber-200 mb-6">
                  您的跨轉單請求已成功提交，等待銷售方審核中
                </p>
                <div className="bg-amber-100 dark:bg-stone-700 border border-amber-200 dark:border-stone-600 rounded-md p-4 mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-medium mb-2 text-amber-900 dark:text-amber-50">跨轉單資訊</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    跨轉單號: {completedTransfers[0].id}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    消耗方: {completedTransfers[0].consumer}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    銷售方: {completedTransfers[0].seller}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    會員姓名: {completedTransfers[0].member}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    訂單編號: {completedTransfers[0].orderId}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    消耗課程: {completedTransfers[0].course}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    提交時間: {completedTransfers[0].date}
                  </p>
                  <p className="text-sm font-medium mt-2 text-amber-800 dark:text-amber-100">
                    狀態: <span className="text-yellow-600 dark:text-yellow-400">待審核</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSearchValue("");
                    setSelectedOrder(null);
                    setConsumptionValues({});
                  }}
                  className="px-4 py-2 mr-2 border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
                >
                  返回首頁
                </button>
                <button
                  onClick={() => setShowTransferHistory(true)}
                  className="px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-md hover:bg-amber-600"
                >
                  查看跨轉單歷史
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ====================== 銷售方介面 ====================== */}
      {interfaceType === "seller" && (
        <main className="max-w-7xl mx-auto px-4 pb-6">
          {/* 上方切換標籤 */}
          <div className="mb-6 border-b border-stone-300 dark:border-stone-600">
            <nav className="-mb-px flex">
              <button
                onClick={() => setShowHistory(false)}
                className={`py-4 px-6 font-medium text-sm ${
                  !showHistory
                    ? "border-b-2 border-blue-500 text-amber-700 dark:text-amber-100"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-600 dark:text-stone-300 hover:border-gray-300"
                }`}
              >
                待審核請求
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`py-4 px-6 font-medium text-sm ${
                  showHistory
                    ? "border-b-2 border-blue-500 text-amber-700 dark:text-amber-100"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-600 dark:text-stone-300 hover:border-gray-300"
                }`}
              >
                審核歷史記錄
              </button>
            </nav>
          </div>

          {/* 依據 showHistory 顯示不同清單 */}
          {!showHistory ? (
            <>
              {/* 篩選 */}
              <div className="mb-4 flex items-center">
                <label className="mr-2 text-sm font-medium text-stone-600 dark:text-stone-300">
                  狀態：
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as typeof filterStatus)
                  }
                  className="p-2 border border-stone-300 dark:border-stone-600 rounded-md text-sm"
                >
                  <option value="待審核">待審核</option>
                  <option value="已審核">已審核</option>
                  <option value="已拒絕">已拒絕</option>
                  <option value="all">全部</option>
                </select>
                <div className="ml-auto">
                  <span className="text-sm text-stone-600 dark:text-stone-300">
                    共 {filteredRequests.length} 筆請求
                  </span>
                </div>
              </div>

              {/* 待審核請求列表 */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-stone-100 dark:bg-stone-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        請求編號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        請求時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        消耗方
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        會員姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        消耗課程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        數量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100">
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-700 dark:text-amber-100 cursor-pointer"
                            onClick={() => viewDetails(request)}
                          >
                            {request.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                            {request.requestTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                            {request.consumer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-900 dark:text-amber-50">
                            {request.member}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                            {request.course}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                            {request.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                request.status === "待審核"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : request.status === "已審核"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "已取消"
                                  ? "bg-stone-200 dark:bg-stone-600 text-gray-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {request.status === "待審核" ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleApprove(request)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                                >
                                  審核通過
                                </button>
                                <button
                                  onClick={() => handleReject(request)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                                >
                                  拒絕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => viewDetails(request)}
                                className="text-amber-700 dark:text-amber-100 hover:text-blue-900"
                              >
                                查看詳情
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-sm text-stone-600 dark:text-stone-300"
                        >
                          沒有符合條件的跨轉單請求
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* 審核歷史記錄 */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-stone-100 dark:bg-stone-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        請求編號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        審核時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        消耗方
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        會員姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        消耗課程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        審核結果
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        審核人
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvalHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100">
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-700 dark:text-amber-100 cursor-pointer"
                          onClick={() => viewDetails(history)}
                        >
                          {history.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                          {history.approveTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                          {history.consumer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-900 dark:text-amber-50">
                          {history.member}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                          {history.course}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              history.status === "已審核"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {history.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                          {history.approver || "--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDetails(history)}
                            className="text-amber-700 dark:text-amber-100 hover:text-blue-900"
                          >
                            查看詳情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      )}

      {/* ====================== 消耗方 - 歷史記錄彈窗 ====================== */}
      {showTransferHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">跨轉單歷史記錄</h2>
              <button
                onClick={() => setShowTransferHistory(false)}
                className="text-stone-600 dark:text-stone-300 hover:text-stone-600 dark:text-stone-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-stone-100 dark:bg-stone-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      單號
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      會員
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      課程
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-amber-900 dark:text-amber-50">
                        {transfer.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                        {transfer.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            transfer.status === "已完成"
                              ? "bg-green-100 text-green-800"
                              : transfer.status === "已取消"
                              ? "bg-red-100 text-red-800"
                              : transfer.status === "待審核"
                              ? "bg-yellow-100 text-yellow-800"
                              : transfer.status === "已拒絕"
                              ? "bg-red-100 text-red-800"
                              : "bg-stone-200 dark:bg-stone-600 text-gray-800"
                          }`}
                        >
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                        {transfer.member}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                        {transfer.course} ({transfer.amount}堂)
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {transfer.canCancel && transfer.status === "已完成" && (
                          <button
                            onClick={() => handleCancelTransfer(transfer)}
                            className="text-red-600 hover:text-red-900"
                          >
                            取消跨轉
                          </button>
                        )}
                        {!transfer.canCancel &&
                          transfer.status === "已取消" && (
                            <span className="text-stone-500 dark:text-stone-300">已取消</span>
                          )}
                        {transfer.status === "待審核" && (
                          <span className="text-stone-600 dark:text-stone-300">等待審核中</span>
                        )}
                        {transfer.status === "已拒絕" && (
                          <span className="text-stone-500 dark:text-stone-300">已拒絕</span>
                        )}
                        {!transfer.canCancel &&
                          transfer.status !== "已取消" &&
                          transfer.status !== "待審核" &&
                          transfer.status !== "已拒絕" && (
                            <span className="text-stone-500 dark:text-stone-300">不可取消</span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-300 dark:border-stone-600">
              <p className="text-sm text-amber-700 dark:text-amber-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block mr-1 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                取消跨轉單說明：僅授予消耗方取消權限，請謹慎操作。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================== 消耗方 - 取消確認彈窗 ====================== */}
      {showCancelConfirm && transferToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-center text-amber-900 dark:text-amber-100">取消跨轉單</h2>
            <div className="bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-md p-3 mb-4">
              <p className="text-sm">
                <strong>跨轉單號:</strong> {transferToCancel.id}
              </p>
              <p className="text-sm">
                <strong>會員:</strong> {transferToCancel.member}
              </p>
              <p className="text-sm">
                <strong>課程:</strong> {transferToCancel.course}
              </p>
              <p className="text-sm">
                <strong>消耗方:</strong> {transferToCancel.consumer}
              </p>
              <p className="text-sm">
                <strong>銷售方:</strong> {transferToCancel.seller}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
                取消原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md h-24"
                placeholder="請詳細說明取消原因，例如：客戶未到、客戶改期等"
              />
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                請提供取消原因以便後續追蹤和分析。
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 inline-block mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                此操作無法撤銷
              </p>
              <div>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setTransferToCancel(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md mr-2 hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
                >
                  返回
                </button>
                <button
                  onClick={confirmCancelTransfer}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  確認取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== 銷售方 - 審核對話框 ====================== */}
      {showApprovalDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-4 text-amber-900 dark:text-amber-100">
              {approvalType === "approve" ? "審核通過" : "拒絕請求"}
            </h2>
            <div className="mb-6 bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-amber-700 dark:text-amber-200">請求編號</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-amber-700 dark:text-amber-200">會員姓名</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.member}</p>
                </div>
                <div>
                  <p className="text-amber-700 dark:text-amber-200">消耗方</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.consumer}</p>
                </div>
                <div>
                  <p className="text-amber-700 dark:text-amber-200">訂單編號</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.orderId}</p>
                </div>
                <div>
                  <p className="text-amber-700 dark:text-amber-200">消耗課程</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.course}</p>
                </div>
                <div>
                  <p className="text-amber-700 dark:text-amber-200">消耗數量</p>
                  <p className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.amount}</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
                {approvalType === "approve" ? "審核備註" : "拒絕原因"}
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md h-32"
                placeholder={
                  approvalType === "approve" ? "請填寫審核備註..." : "請填寫拒絕原因..."
                }
              />
              {errorMessage && (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setErrorMessage("");
                }}
                className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md mr-2 hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
              >
                取消
              </button>
              <button
                onClick={submitApproval}
                className={`px-4 py-2 text-white rounded-md ${
                  approvalType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {approvalType === "approve" ? "確認審核通過" : "確認拒絕"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== 銷售方 - 最終確認對話框 ====================== */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-4 text-yellow-500 dark:text-yellow-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-center text-amber-900 dark:text-amber-100">確認操作</h2>
            <p className="text-center text-amber-700 dark:text-amber-200 mb-6">
              您確定要
              {approvalType === "approve" ? "通過" : "拒絕"}此跨轉單請求嗎？此操作無法撤銷。
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md mr-2 hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
              >
                取消
              </button>
              <button
                onClick={confirmApproval}
                className={`px-4 py-2 text-white rounded-md ${
                  approvalType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== 銷售方 - 詳情對話框 ====================== */}
      {showDetailsDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold mb-4 text-amber-900 dark:text-amber-100">跨轉單詳情</h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedRequest.status === "待審核"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedRequest.status === "已審核"
                    ? "bg-green-100 text-green-800"
                    : selectedRequest.status === "已取消"
                    ? "bg-stone-200 dark:bg-stone-600 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedRequest.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
                  基本信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-200">請求編號</span>
                    <span className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-200">請求時間</span>
                    <span>{selectedRequest.requestTime}</span>
                  </div>
                  {selectedRequest.approveTime && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-200">審核時間</span>
                      <span>{selectedRequest.approveTime}</span>
                    </div>
                  )}
                  {selectedRequest.approver && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-200">審核人</span>
                      <span>{selectedRequest.approver}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
                  消耗信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-200">消耗方</span>
                    <span>{selectedRequest.consumer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-200">會員姓名</span>
                    <span className="font-medium text-amber-900 dark:text-amber-100">{selectedRequest.member}</span>
                  </div>
                  {selectedRequest.phone && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 dark:text-amber-200">手機號碼</span>
                      <span>{selectedRequest.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-200">訂單編號</span>
                    <span>{selectedRequest.orderId}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6 bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
              <h3 className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
                課程詳情
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-stone-200 dark:bg-stone-600">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-600 dark:text-stone-300">
                        課程名稱
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-600 dark:text-stone-300">
                        消耗數量
                      </th>
                      {selectedRequest.remainingAfter !== undefined && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-stone-600 dark:text-stone-300">
                          消耗後剩餘
                        </th>
                      )}
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-600 dark:text-stone-300">
                        共用課程
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 這裡僅示範一列; 若實際需要多課程，請自行擴充邏輯 */}
                    <tr>
                      <td className="px-4 py-2 text-sm">
                        {selectedRequest.course}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {selectedRequest.amount}
                      </td>
                      {selectedRequest.remainingAfter !== undefined && (
                        <td className="px-4 py-2 text-sm">
                          {selectedRequest.remainingAfter}
                        </td>
                      )}
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          是
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {(selectedRequest.requestNote || selectedRequest.approveNote) && (
              <div className="mb-6 bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
                  備註信息
                </h3>
                {selectedRequest.requestNote && (
                  <div className="mb-3">
                    <span className="text-amber-700 dark:text-amber-200 text-xs block mb-1">
                      消耗方請求備註：
                    </span>
                    <p className="text-sm bg-white p-2 rounded border border-stone-300 dark:border-stone-600">
                      {selectedRequest.requestNote || "無"}
                    </p>
                  </div>
                )}
                {selectedRequest.approveNote && (
                  <div>
                    <span className="text-amber-700 dark:text-amber-200 text-xs block mb-1">
                      審核備註：
                    </span>
                    <p className="text-sm bg-white p-2 rounded border border-stone-300 dark:border-stone-600">
                      {selectedRequest.approveNote}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailsDialog(false)}
                className="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-100 dark:bg-stone-700 dark:hover:bg-stone-600 text-amber-900 dark:text-amber-100"
              >
                關閉
              </button>
              {selectedRequest.status === "待審核" && (
                <div className="ml-2 space-x-2">
                  <button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleApprove(selectedRequest);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    審核通過
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleReject(selectedRequest);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    拒絕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedCrossUnitTransferSystem;
