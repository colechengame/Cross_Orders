"use client";

import React, { useState } from "react";

const IntegratedCrossUnitTransferSystem = () => {
  // -----------------------------
  // State 與資料
  // -----------------------------
  const [interfaceType, setInterfaceType] = useState("consumer"); // 'consumer' or 'seller'
  const [currentStep, setCurrentStep] = useState(1);
  const [searchType, setSearchType] = useState("phone");
  const [searchValue, setSearchValue] = useState("");
  const [memberStatus, setMemberStatus] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [consumptionValues, setConsumptionValues] = useState({});
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [transferToCancel, setTransferToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [userDepartment, setUserDepartment] = useState("板橋醫美");

  const [transferRequests, setTransferRequests] = useState([
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
    },
  ]);

  const [approvalHistory, setApprovalHistory] = useState([
    {
      id: "CTR-20240308-001",
      requestTime: "2024-03-08 09:10",
      status: "已審核",
      consumer: "漾澤",
      member: "林小花",
      orderId: "SO-20240220-019",
      course: "保濕護理課程",
      amount: 1,
      approveTime: "2024-03-08 10:05",
      approver: "王經理",
      approveNote: "已電話確認客戶需求",
    },
    {
      id: "CTR-20240307-003",
      requestTime: "2024-03-07 14:20",
      status: "已拒絕",
      consumer: "愛美肌",
      member: "張大明",
      orderId: "SO-20240215-027",
      course: "美白調理課程",
      amount: 3,
      approveTime: "2024-03-07 15:30",
      approver: "李主管",
      approveNote: "課程剩餘次數不足，已與消耗方溝通",
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalType, setApprovalType] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterStatus, setFilterStatus] = useState("待審核");

  const [errorMessage, setErrorMessage] = useState("");
  const [completedTransfers, setCompletedTransfers] = useState([
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

  const mockMemberData = {
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

  // -----------------------------
  // 1. 切換角色
  // -----------------------------
  const switchUserRole = () => {
    setInterfaceType(interfaceType === "consumer" ? "seller" : "consumer");

    if (interfaceType === "seller") {
      // 從銷售方切回消耗方，重置部分狀態
      setCurrentStep(1);
      setSearchValue("");
      setSelectedOrder(null);
      setConsumptionValues({});
      setShowTransferHistory(false);
    } else {
      // 從消耗方切回銷售方，重置部分狀態
      setShowHistory(false);
      setSelectedRequest(null);
    }
  };

  // -----------------------------
  // 2. 消耗方操作：會員查詢
  // -----------------------------
  const handleSearch = () => {
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

  // -----------------------------
  // 3. 消耗方操作：選擇訂單
  // -----------------------------
  const handleSelectOrder = (order) => {
    const hasSharedCourses = order.items.some((item) => item.shared);
    if (!hasSharedCourses) {
      setErrorMessage("所選訂單不包含任何共用課程，無法進行跨轉");
      return;
    }
    const initialValues = {};
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

  // -----------------------------
  // 4. 消耗方操作：填寫消耗數量
  // -----------------------------
  const handleConsumptionChange = (courseName, value) => {
    setConsumptionValues((prev) => ({
      ...prev,
      [courseName]: value,
    }));
  };

  // -----------------------------
  // 5. 消耗方操作：發起跨轉單
  // -----------------------------
  const handleSubmitRequest = () => {
    const hasSelected = Object.values(consumptionValues).some(
      (value) => typeof value === "number" && value > 0
    );
    if (!hasSelected) {
      setErrorMessage("請至少選擇一項課程進行消耗");
      return;
    }

    let isValid = true;
    let errorMsg = "";
    if (selectedOrder) {
      selectedOrder.items.forEach((item) => {
        if (item.shared && consumptionValues[item.name] > item.remaining) {
          isValid = false;
          errorMsg = `${item.name} 的消耗數量不能超過剩餘數量 ${item.remaining}`;
        }
      });
    }
    if (!isValid) {
      setErrorMessage(errorMsg);
      return;
    }

    if (!selectedOrder) return;

    const now = new Date();
    const newTransfer = {
      id: `CTR-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0")}`,
      date: now.toISOString().slice(0, 16).replace("T", " "),
      requestTime: now.toISOString().slice(0, 16).replace("T", " "),
      status: "待審核",
      consumer: userDepartment,
      seller: selectedOrder.store,
      member: mockMemberData.name,
      phone: mockMemberData.phone,
      orderId: selectedOrder.id,
      course: Object.entries(consumptionValues)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => `${name} x ${value}`)
        .join(", "),
      amount: Object.values(consumptionValues).reduce(
        (sum, value) => sum + value,
        0
      ),
      canCancel: true,
      remainingAfter: selectedOrder.items[0]
        ? selectedOrder.items[0].remaining -
          (consumptionValues[selectedOrder.items[0].name] || 0)
        : 0,
      requestNote: "客戶要求在本店進行療程",
    };

    setCompletedTransfers((prev) => [newTransfer, ...prev]);
    setTransferRequests((prev) => [newTransfer, ...prev]);

    setCurrentStep(4);
    setErrorMessage("");
  };

  // -----------------------------
  // 6. 消耗方操作：取消跨轉單
  // -----------------------------
  const handleCancelTransfer = (transfer) => {
    setTransferToCancel(transfer);
    setShowCancelConfirm(true);
  };

  const confirmCancelTransfer = (event) => {
    event.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMessage("請提供取消原因");
      return;
    }
    if (transferToCancel) {
      setCompletedTransfers((prev) =>
        prev.map((item) =>
          item.id === transferToCancel.id
            ? { ...item, status: "已取消", canCancel: false }
            : item
        )
      );
      setTransferRequests((prev) =>
        prev.map((item) =>
          item.id === transferToCancel.id ? { ...item, status: "已取消" } : item
        )
      );
      setErrorMessage("");
      setShowCancelConfirm(false);
      setTransferToCancel(null);
      setCancelReason("");
    }
  };

  // -----------------------------
  // 7. 銷售方操作：篩選 + 審核
  // -----------------------------
  const filteredRequests = transferRequests.filter((request) =>
    filterStatus === "all" ? true : request.status === filterStatus
  );

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setApprovalType("approve");
    setApprovalNote("");
    setShowApprovalDialog(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setApprovalType("reject");
    setApprovalNote("");
    setShowApprovalDialog(true);
  };

  const submitApproval = () => {
    if (!approvalNote.trim()) {
      setErrorMessage("請填寫審核備註");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmApproval = () => {
    const now = new Date().toLocaleString("zh-TW");
    const updatedRequests = transferRequests.map((req) => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: approvalType === "approve" ? "已審核" : "已拒絕",
          approveTime: now,
          approveNote: approvalNote,
          approver: "王經理",
        };
      }
      return req;
    });
    setTransferRequests(updatedRequests);

    if (selectedRequest) {
      const historyItem = {
        ...selectedRequest,
        status: approvalType === "approve" ? "已審核" : "已拒絕",
        approveTime: now,
        approver: "王經理",
        approveNote: approvalNote,
      };
      setApprovalHistory([historyItem, ...approvalHistory]);

      setCompletedTransfers((prev) =>
        prev.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: approvalType === "approve" ? "已完成" : "已拒絕",
              }
            : item
        )
      );
    }

    setShowApprovalDialog(false);
    setShowConfirmation(false);
    setSelectedRequest(null);
    setErrorMessage("");
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 頂部 Header */}
      <header className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {interfaceType === "consumer" ? "跨轉單處理系統" : "跨轉單審核系統"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {interfaceType === "consumer"
                ? `消耗方操作介面 - ${userDepartment} (接收跨轉單部門)`
                : `銷售方操作介面 - 愛美肌 (課程銷售部門)`}
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={switchUserRole}
              className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300 flex items-center mr-2"
            >
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  interfaceType === "consumer" ? "bg-green-500" : "bg-blue-500"
                }`}
              />
              {interfaceType === "consumer" ? "切換為銷售方" : "切換為消耗方"}
            </button>
            {interfaceType === "consumer" && (
              <button
                onClick={() => setShowTransferHistory(!showTransferHistory)}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 flex items-center"
              >
                歷史記錄
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 消耗方介面 */}
      {interfaceType === "consumer" && (
        <main className="bg-white p-6 rounded-lg shadow">
          {/* 進度條 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 1 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1
                      ? "border-blue-600 bg-blue-100"
                      : "border-gray-400"
                  }`}
                >
                  1
                </div>
                <span className="mt-1 text-sm">會員查詢</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 2 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2
                      ? "border-blue-600 bg-blue-100"
                      : "border-gray-400"
                  }`}
                >
                  2
                </div>
                <span className="mt-1 text-sm">歷購確認</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 3 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3
                      ? "border-blue-600 bg-blue-100"
                      : "border-gray-400"
                  }`}
                >
                  3
                </div>
                <span className="mt-1 text-sm">課程消耗</span>
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep >= 4 ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 4 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 4
                      ? "border-blue-600 bg-blue-100"
                      : "border-gray-400"
                  }`}
                >
                  4
                </div>
                <span className="mt-1 text-sm">完成跨轉</span>
              </div>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* 步驟1: 查詢會員 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">查詢會員資料</h2>
              <div className="flex mb-4">
                <div
                  className={`px-4 py-2 cursor-pointer rounded-l-md ${
                    searchType === "phone"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setSearchType("phone")}
                >
                  手機號碼
                </div>
                <div
                  className={`px-4 py-2 cursor-pointer rounded-r-md ${
                    searchType === "name"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
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
                      ? "請輸入會員手機號碼 (測試：0912345678)"
                      : "請輸入會員姓名 (測試：王小明)"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md"
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
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

              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                <p className="text-sm text-yellow-800">
                  提示：您可以使用 "0912345678" 或 "王小明" 來測試成功的查詢結果
                </p>
              </div>
            </div>
          )}

          {/* 步驟2: 歷購訂單 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">確認銷售訂單歸屬門市與歷購內容</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">會員資料</h3>
                    <p className="text-sm mt-1">姓名: {mockMemberData.name}</p>
                    <p className="text-sm">手機: {mockMemberData.phone}</p>
                    <p className="text-sm">
                      主要門市: {mockMemberData.mainStore}
                    </p>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-md">
                    <p className="text-sm text-green-800">已綁定跨體系帳號</p>
                  </div>
                </div>
              </div>
              <h3 className="font-medium mb-2">歷購銷售訂單列表</h3>
              <p className="text-sm text-gray-600 mb-4">請選擇要進行消耗的訂單</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        訂單編號
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        所屬門市
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        購買日期
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        狀態
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMemberData.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b text-sm">{order.id}</td>
                        <td className="px-4 py-3 border-b text-sm">
                          {order.store}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {order.date}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          <button
                            onClick={() => handleSelectOrder(order)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
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
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  返回
                </button>
              </div>
            </div>
          )}

          {/* 步驟3: 填寫消耗數量 */}
          {currentStep === 3 && selectedOrder && (
            <div>
              <h2 className="text-lg font-semibold mb-4">課程消耗操作</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="font-medium">訂單資訊</h3>
                <p className="text-sm mt-1">訂單編號: {selectedOrder.id}</p>
                <p className="text-sm">所屬門市: {selectedOrder.store}</p>
                <p className="text-sm">購買日期: {selectedOrder.date}</p>
                <p className="text-sm">會員: {mockMemberData.name}</p>
              </div>
              <h3 className="font-medium mb-2">課程項目</h3>
              <p className="text-sm text-gray-600 mb-4">
                請選擇要消耗的課程項目與數量
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        課程名稱
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        總堂數
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        已使用
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        剩餘
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        共用課程
                      </th>
                      <th className="px-4 py-2 border-b text-left text-sm">
                        消耗數量
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          !item.shared ? "bg-gray-100" : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3 border-b text-sm">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {item.total}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {item.used}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {item.remaining}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {item.shared ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              是
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              否
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {item.shared ? (
                            <input
                              type="number"
                              min="0"
                              max={item.remaining}
                              value={consumptionValues[item.name] || 0}
                              onChange={(e) =>
                                handleConsumptionChange(
                                  item.name,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 p-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span className="text-gray-400">不可跨轉</span>
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
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  發起跨轉單
                </button>
              </div>
            </div>
          )}

          {/* 步驟4: 完成跨轉 */}
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
                <p className="text-gray-600 mb-6">
                  您的跨轉單請求已成功提交，等待銷售方審核中
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-medium mb-2">跨轉單資訊</h3>
                  <p className="text-sm">跨轉單號: {completedTransfers[0].id}</p>
                  <p className="text-sm">
                    消耗方: {completedTransfers[0].consumer}
                  </p>
                  <p className="text-sm">
                    銷售方: {completedTransfers[0].seller}
                  </p>
                  <p className="text-sm">
                    會員姓名: {completedTransfers[0].member}
                  </p>
                  <p className="text-sm">
                    訂單編號: {completedTransfers[0].orderId}
                  </p>
                  <p className="text-sm">
                    消耗課程: {completedTransfers[0].course}
                  </p>
                  <p className="text-sm">
                    提交時間: {completedTransfers[0].date}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    狀態: <span className="text-yellow-600">待審核</span>
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
                  className="px-4 py-2 mr-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  返回首頁
                </button>
                <button
                  onClick={() => setShowTransferHistory(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  查看跨轉單歷史
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* 銷售方介面 */}
      {interfaceType === "seller" && (
        <main className="max-w-7xl mx-auto px-4 pb-6">
          {/* 上方切換標籤 */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setShowHistory(false)}
                className={`py-4 px-6 font-medium text-sm ${
                  !showHistory
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                待審核請求
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`py-4 px-6 font-medium text-sm ${
                  showHistory
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                審核歷史記錄
              </button>
            </nav>
          </div>

          {!showHistory ? (
            <>
              {/* 篩選區 */}
              <div className="mb-4 flex items-center">
                <label className="mr-2 text-sm font-medium text-gray-700">
                  狀態：
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="待審核">待審核</option>
                  <option value="已審核">已審核</option>
                  <option value="已拒絕">已拒絕</option>
                  <option value="all">全部</option>
                </select>
                <div className="ml-auto">
                  <span className="text-sm text-gray-500">
                    共 {filteredRequests.length} 筆請求
                  </span>
                </div>
              </div>

              {/* 待審核請求列表 */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        請求編號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        請求時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        消耗方
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        會員姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        消耗課程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        數量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                            onClick={() => viewDetails(request)}
                          >
                            {request.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.requestTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.consumer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.member}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.course}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                  ? "bg-gray-100 text-gray-800"
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
                                className="text-blue-600 hover:text-blue-900"
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
                          className="px-6 py-4 text-center text-sm text-gray-500"
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        請求編號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        審核時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        消耗方
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        會員姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        消耗課程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        審核結果
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        審核人
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvalHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                          onClick={() => viewDetails(history)}
                        >
                          {history.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.approveTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.consumer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.member}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.approver}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDetails(history)}
                            className="text-blue-600 hover:text-blue-900"
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

      {/* 
        以下省略各種彈窗 / Dialog，包括：
        - 消耗方歷史紀錄 (showTransferHistory)
        - 取消跨轉單 (showCancelConfirm)
        - 銷售方審核彈窗 (showApprovalDialog, showConfirmation)
        - 詳情彈窗 (showDetailsDialog)
        ...
        只要在同一檔案中完成即可
      */}
    </div>
  );
};

export default IntegratedCrossUnitTransferSystem;
