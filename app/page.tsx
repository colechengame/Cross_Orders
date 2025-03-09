"use client";

// app/cross-unit-transfer/page.tsx
import { useState } from 'react';
import Head from 'next/head';

export default function CrossUnitTransfer() {
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  type OperationHistoryItem = {
    action: OperationAction;
    data: any;
    timestamp: string;
    step: number;
  };
  
  const [operationHistory, setOperationHistory] = useState<OperationHistoryItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedTransfers, setCompletedTransfers] = useState([
    {
      id: 'CTR-20240308-001',
      date: '2024-03-08 15:22',
      status: '已完成',
      consumer: '愛美肌',
      seller: '板橋醫美',
      member: '林小花',
      orderId: 'SO-20240301-025',
      course: '美白護理課程',
      amount: 2,
      canCancel: true
    },
    {
      id: 'CTR-20240307-003',
      date: '2024-03-07 10:35',
      status: '已完成',
      consumer: '愛美肌',
      seller: '漾澤',
      member: '陳大明',
      orderId: 'SO-20240225-098',
      course: '肌膚緊緻課程',
      amount: 1,
      canCancel: false
    }
  ]);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  type Transfer = {
    id: string;
    date: string;
    status: string;
    consumer: string;
    seller: string;
    member: string;
    orderId: string;
    course: string;
    amount: number;
    canCancel: boolean;
  };
  const [transferToCancel, setTransferToCancel] = useState<Transfer | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // 模擬會員資料
  const mockMemberData = {
    name: '王小明',
    phone: '0912345678',
    mainStore: '愛美肌',
    relatedStores: ['板橋醫美', '漾澤'],
    orders: [
      { 
        id: 'SO-20240305-001', 
        store: '愛美肌', 
        date: '2024-03-05', 
        items: [
          { name: '肌膚緊緻課程', total: 10, used: 3, remaining: 7, shared: true }
        ],
        status: '有效'
      },
      { 
        id: 'SO-20240210-042', 
        store: '板橋醫美', 
        date: '2024-02-10', 
        items: [
          { name: '保濕護理課程', total: 5, used: 2, remaining: 3, shared: true },
          { name: '美白調理課程', total: 8, used: 0, remaining: 8, shared: false }
        ],
        status: '有效'
      }
    ]
  };

  // 記錄操作歷史
  type OperationAction = 'step_change' | 'select_order' | 'submit';
  const addToHistory = (action: OperationAction, data: any) => {
    const timestamp = new Date().toISOString();
    setOperationHistory(prev => [...prev, { action, data, timestamp, step: currentStep }]);
  };

  // 復原到上一步
  const undoLastOperation = () => {
    if (operationHistory.length > 0) {
      const lastOperation = operationHistory[operationHistory.length - 1];
      
      // 根據上一步操作類型進行相應的復原
      if (lastOperation.action === 'step_change') {
        setCurrentStep(lastOperation.data.previousStep);
      } else if (lastOperation.action === 'select_order') {
        setSelectedOrder(null);
      }
      
      // 移除最後一個操作記錄
      setOperationHistory(prev => prev.slice(0, -1));
      setErrorMessage('');
    }
  };

  // 確認操作
  const confirmOperation = (_operation: OperationAction, nextAction: () => void) => {
    setConfirmAction(() => nextAction);
    setShowConfirmation(true);
  };

  // 搜尋會員
  const handleSearch = () => {
    // 表單驗證
    if (!searchValue.trim()) {
      setErrorMessage('請輸入查詢內容');
      return;
    }
    
    if (searchType === 'phone' && !/^\d{10}$/.test(searchValue)) {
      setErrorMessage('手機號碼格式不正確，請輸入10位數字');
      return;
    }
    
    // 記錄當前步驟
    addToHistory('step_change', { previousStep: currentStep });
    
    // 模擬搜尋結果
    if (searchValue.length > 3) {
      setMemberStatus('found');
      setCurrentStep(2);
    } else {
      setMemberStatus('notFound');
    }
    setErrorMessage('');
  };

  // 選擇訂單
  interface OrderItem {
    name: string;
    total: number;
    used: number;
    remaining: number;
    shared: boolean;
  }

  interface Order {
    id: string;
    store: string;
    date: string;
    items: OrderItem[];
    status: string;
  }

  const handleSelectOrder = (order: Order): void => {
    // 檢查訂單是否包含共用課程 
    const hasSharedCourses = order.items.some(item => item.shared);
    
    if (!hasSharedCourses) {
      setErrorMessage('所選訂單不包含任何共用課程，無法進行跨轉');
      return;
    }
    
    // 確認操作
    confirmOperation('select_order', () => {
      addToHistory('select_order', { previousOrder: selectedOrder });
      setSelectedOrder(order);
      setCurrentStep(3);
      setErrorMessage('');
    });
  };

  // 提交跨轉單請求
  const handleSubmitRequest = () => {
    // 驗證是否選擇了消耗項目
    const consumptionInputs = document.querySelectorAll('input[type="number"]');
    let hasSelected = false;
    let isValid = true;
    let hasExceededLimit = false;
    
    consumptionInputs.forEach(input => {
      const value = parseInt((input as HTMLInputElement).value);
      if (value > 0) {
        hasSelected = true;
        
        // 檢查是否超出可消耗數量
        const maxAttr = input.getAttribute('max') || '0';
        const max = parseInt(maxAttr);
        if (value > max) {
          isValid = false;
          hasExceededLimit = true;
        }
      }
    });
    
    if (!hasSelected) {
      setErrorMessage('請至少選擇一項課程進行消耗');
      return;
    }
    
    if (!isValid) {
      setErrorMessage(hasExceededLimit ? '消耗數量不能超過剩餘數量' : '請確認消耗數量設置正確');
      return;
    }
    
    // 確認操作
    confirmOperation('submit', () => {
      addToHistory('step_change', { previousStep: currentStep });
      setCurrentStep(4);
      // 這裡會實際處理提交邏輯
      setErrorMessage('');
    });
  };

  // 模擬用戶角色和權限
  const [userRole, setUserRole] = useState('consumer'); // 'consumer'=消耗方, 'seller'=銷售方
  const [userDepartment, setUserDepartment] = useState('愛美肌');

  // 用於切換用戶角色(開發測試用)
  const switchUserRole = () => {
    setUserRole(userRole === 'consumer' ? 'seller' : 'consumer');
    setUserDepartment(userRole === 'consumer' ? '板橋醫美' : '愛美肌');
  };

  function handleVerifyIdentity(event: React.MouseEvent<HTMLButtonElement>): void {
    // Prevent default form submission
    event.preventDefault();

    // Here we would typically validate the verification form inputs before proceeding
    const form = event.currentTarget.closest('form');
    const inputs = document.querySelectorAll('input');
    let isValid = true;
    let errorMessage = '';

    // Basic validation
    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        errorMessage = '請填寫所有必填欄位';
      }
    });

    if (!isValid) {
      setErrorMessage(errorMessage);
      return;
    }

    // In a real implementation, we would:
    // 1. Call an API to verify the member's identity
    // 2. Update the member's record if necessary
    // 3. Link accounts if needed

    // For now, simulate a successful verification
    setMemberStatus('found');
    setShowVerificationPanel(false);
    setCurrentStep(2);
    setErrorMessage('');

    // Add to operation history
    addToHistory('step_change', { previousStep: currentStep });
  }
  function handleCancelTransfer(transfer: { id: string; date: string; status: string; consumer: string; seller: string; member: string; orderId: string; course: string; amount: number; canCancel: boolean; }): void {
    throw new Error('Function not implemented.');
  }

  function confirmCancelTransfer(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>跨轉單處理系統 | BU3→BU1 轉單</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">跨轉單處理系統</h1>
              <p className="mt-1 text-sm text-gray-600">
                {userRole === 'consumer' 
                  ? `消耗方操作介面 - ${userDepartment} (接收跨轉單部門)` 
                  : `銷售方操作介面 - ${userDepartment} (課程銷售部門)`}
              </p>
            </div>
            
            {/* 角色切換區 (僅供開發測試) */}
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">當前角色:</span>
              <button 
                onClick={switchUserRole}
                className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300 flex items-center"
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${userRole === 'consumer' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                {userRole === 'consumer' ? '消耗方' : '銷售方'}
              </button>
              
              {/* 歷史記錄按鈕 */}
              <button 
                onClick={() => setShowTransferHistory(!showTransferHistory)}
                className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                跨轉單歷史
              </button>
            </div>
          </div>
          
          {/* 角色說明 */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">操作角色說明</h3>
            <p className="text-xs text-yellow-700">
              {userRole === 'consumer' 
                ? '消耗方（接收跨轉單部門）負責發起跨轉請求、執行療程消耗以及必要時取消跨轉單。作為實際為客戶提供服務的部門，您最了解客戶需求和服務狀況。' 
                : '銷售方（課程銷售部門）可查看跨轉單狀態並審核跨轉請求。由於實際療程是在消耗方執行，跨轉單的取消應由消耗方發起。'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">
        {/* 操作控制面板 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            {currentStep > 1 && (
              <button 
                onClick={undoLastOperation} 
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回上一步
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-2">操作記錄: {operationHistory.length}</span>
            
            {currentStep < 4 && (
              <button 
                onClick={() => setCurrentStep(1)} 
                className="flex items-center text-red-600 hover:text-red-800 ml-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                取消操作
              </button>
            )}
          </div>
        </div>

        {/* 錯誤訊息 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </p>
          </div>
        )}
      
        {/* 進度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>1</div>
              <span className="mt-1 text-sm">會員查詢</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>2</div>
              <span className="mt-1 text-sm">歷購確認</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>3</div>
              <span className="mt-1 text-sm">課程消耗</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 4 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>4</div>
              <span className="mt-1 text-sm">發起跨轉</span>
            </div>
          </div>
        </div>

        {/* 步驟 1: 會員查詢 */}
        {currentStep === 1 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">消耗方-查詢與確認會員歷購歷銷：限共用課程</h2>
            <div className="mb-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                <p className="text-sm text-yellow-800">系統會自動比對並綁定姓名＆手機號碼相同的跨體系會員</p>
              </div>

              <div className="flex mb-4">
                <div 
                  className={`px-4 py-2 cursor-pointer ${searchType === 'phone' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSearchType('phone')}
                >
                  手機號碼
                </div>
                <div 
                  className={`px-4 py-2 cursor-pointer ${searchType === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSearchType('name')}
                >
                  會員姓名
                </div>
              </div>

              <div className="flex">
                <input
                  type="text"
                  placeholder={searchType === 'phone' ? "請輸入會員手機號碼" : "請輸入會員姓名"}
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

              {memberStatus === 'notFound' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">查無會員資料，請確認輸入資訊是否正確</p>
                  <button 
                    onClick={() => setShowVerificationPanel(true)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    進行身份核對與基本資料校正
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 border-t pt-4">
              <h3 className="text-md font-medium mb-2">操作說明</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>僅限查詢共用課程的會員資料</li>
                <li>可使用手機號碼或姓名進行查詢</li>
                <li>若查無資料，可進行身份核對與基本資料校正</li>
              </ul>
            </div>
          </div>
        )}

        {/* 步驟 2: 會員歷購確認 */}
        {currentStep === 2 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">確認銷售訂單歸屬門市與歷購內容</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">會員資料</h3>
                  <p className="text-sm mt-1">姓名: {mockMemberData.name}</p>
                  <p className="text-sm">手機: {mockMemberData.phone}</p>
                  <p className="text-sm">主要門市: {mockMemberData.mainStore}</p>
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
                    <th className="px-4 py-2 border-b text-left text-sm">訂單編號</th>
                    <th className="px-4 py-2 border-b text-left text-sm">所屬門市</th>
                    <th className="px-4 py-2 border-b text-left text-sm">購買日期</th>
                    <th className="px-4 py-2 border-b text-left text-sm">狀態</th>
                    <th className="px-4 py-2 border-b text-left text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMemberData.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b text-sm">{order.id}</td>
                      <td className="px-4 py-3 border-b text-sm">{order.store}</td>
                      <td className="px-4 py-3 border-b text-sm">{order.date}</td>
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
                          查看明細
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
                className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
              >
                返回
              </button>
            </div>
          </div>
        )}

        {/* 步驟 3: 課程消耗 */}
        {currentStep === 3 && selectedOrder && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">課程消耗操作</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-medium">訂單資訊</h3>
              <p className="text-sm mt-1">訂單編號: {selectedOrder.id}</p>
              <p className="text-sm">所屬門市: {selectedOrder.store}</p>
              <p className="text-sm">購買日期: {selectedOrder.date}</p>
            </div>
            
            <h3 className="font-medium mb-2">課程項目</h3>
            <p className="text-sm text-gray-600 mb-4">請選擇要消耗的課程項目與數量</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border-b text-left text-sm">課程名稱</th>
                    <th className="px-4 py-2 border-b text-left text-sm">總堂數</th>
                    <th className="px-4 py-2 border-b text-left text-sm">已使用</th>
                    <th className="px-4 py-2 border-b text-left text-sm">剩餘</th>
                    <th className="px-4 py-2 border-b text-left text-sm">共用課程</th>
                    <th className="px-4 py-2 border-b text-left text-sm">消耗數量</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index} className={!item.shared ? 'bg-gray-100' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 border-b text-sm">{item.name}</td>
                      <td className="px-4 py-3 border-b text-sm">{item.total}</td>
                      <td className="px-4 py-3 border-b text-sm">{item.used}</td>
                      <td className="px-4 py-3 border-b text-sm">{item.remaining}</td>
                      <td className="px-4 py-3 border-b text-sm">
                        {item.shared ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">是</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">否</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b text-sm">
                        {item.shared ? (
                          <input 
                            type="number" 
                            min="0" 
                            max={item.remaining}
                            defaultValue="0"
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

            <div className="mt-6 p-4 border border-orange-200 bg-orange-50 rounded-md">
              <p className="text-sm text-orange-700">
                <span className="font-medium">注意事項：</span> 僅限選取最遠期有效銷售單號&指定消耗的品項與數量
              </p>
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

        {/* 步驟 4: 跨轉單確認 */}
        {currentStep === 4 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">跨轉單已發起</h2>
              <p className="text-gray-600 mb-6">您的跨轉單請求已成功提交，請等待審核與處理</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
                <h3 className="font-medium mb-2">跨轉單資訊</h3>
                <p className="text-sm">跨轉單號: CTR-20240309-001</p>
                <p className="text-sm">消耗方: 愛美肌</p>
                <p className="text-sm">銷售方: 板橋醫美</p>
                <p className="text-sm">會員姓名: 王小明</p>
                <p className="text-sm">訂單編號: SO-20240210-042</p>
                <p className="text-sm">消耗課程: 保濕護理課程</p>
                <p className="text-sm">消耗數量: 1</p>
                <p className="text-sm">提交時間: 2024-03-09 14:30</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                返回首頁
              </button>
            </div>
          </div>
        )}

        {/* 身份驗證面板 */}
        {showVerificationPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-semibold mb-4">會員身份核對</h2>
              
              <p className="text-sm text-gray-600 mb-4">
                請致電或透過Line群組與該<span className="text-red-600 font-medium">建檔門市外場主管/加盟店員工</span>進行身份核對與會員基本資料校正
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">身份證字號 (後四碼)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">維護會員身份單位</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>指定諮詢師所屬單位</option>
                  <option>建檔門市單位</option>
                  <option>該銷售訂單所屬單位</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowVerificationPanel(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleVerifyIdentity}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  確認核對
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 操作確認面板 */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center justify-center mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold mb-2 text-center">操作確認</h2>
              
              <p className="text-center text-gray-600 mb-6">
                確定要執行此操作嗎？此操作將改變當前流程狀態。
              </p>
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (confirmAction) confirmAction();
                    setShowConfirmation(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  確認操作
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 跨轉單歷史記錄 */}
        {showTransferHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">跨轉單歷史記錄</h2>
                <button 
                  onClick={() => setShowTransferHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>操作權限說明：</strong> 
                  {userRole === 'consumer' 
                    ? '作為消耗方（接收跨轉單部門），您可以取消尚未執行的跨轉單。由於您直接為客戶提供服務，系統允許您在必要時取消跨轉操作。' 
                    : '作為銷售方（課程銷售部門），您可以查看跨轉單狀態，但取消操作需由消耗方發起。這是因為消耗方作為服務提供者，最了解客戶的實際情況。'}
                </p>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">單號</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消耗方</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銷售方</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">會員</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">課程</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {completedTransfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transfer.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transfer.status === '已完成' ? 'bg-green-100 text-green-800' : 
                            transfer.status === '已取消' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transfer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transfer.consumer}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transfer.seller}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transfer.member}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {transfer.course} x {transfer.amount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {transfer.canCancel && userRole === 'consumer' && (
                            <button 
                              onClick={() => handleCancelTransfer(transfer)}
                              className="text-red-600 hover:text-red-900"
                            >
                              取消跨轉
                            </button>
                          )}
                          {!transfer.canCancel && transfer.status === '已取消' && (
                            <span className="text-gray-400">已取消</span>
                          )}
                          {!transfer.canCancel && transfer.status !== '已取消' && (
                            <span className="text-gray-400">不可取消</span>
                          )}
                          {transfer.canCancel && userRole === 'seller' && (
                            <span className="text-gray-500">僅消耗方可取消</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  取消跨轉單說明：由於跨轉單涉及實際療程執行，取消權限僅授予消耗方（接收跨轉單部門）。消耗方負責實際服務提供，最了解客戶需求和服務狀況，因此最適合判斷是否需要取消跨轉操作。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 取消跨轉單確認 */}
        {showCancelConfirm && transferToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold mb-2 text-center">取消跨轉單</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                <p className="text-sm"><strong>跨轉單號:</strong> {transferToCancel.id}</p>
                <p className="text-sm"><strong>會員:</strong> {transferToCancel.member}</p>
                <p className="text-sm"><strong>課程:</strong> {transferToCancel.course} x {transferToCancel.amount}</p>
                <p className="text-sm"><strong>消耗方:</strong> {transferToCancel.consumer}</p>
                <p className="text-sm"><strong>銷售方:</strong> {transferToCancel.seller}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  取消原因 <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                  placeholder="請詳細說明取消原因，例如：客戶未到、客戶改期、服務調整等"
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  作為消耗方，您可以取消跨轉單。請提供取消原因以便後續追蹤和分析。
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  此操作無法撤銷
                </p>
                
                <div>
                  <button 
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setTransferToCancel(null);
                      setCancelReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
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
      </main>
    </div>
  );
}