"use client";
// pages/cross-unit-transfer.js
import { useState } from 'react';
import Head from 'next/head';

export default function CrossUnitTransfer() {
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [memberStatus, setMemberStatus] = useState<'found' | 'notFound' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  
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

  // 搜尋會員
  const handleSearch = () => {
    // 模擬搜尋結果
    if (searchValue.length > 3) {
      setMemberStatus('found');
      setCurrentStep(2);
    } else {
      setMemberStatus('notFound');
    }
  };

  interface Order {
    id: string;
    store: string;
    date: string;
    items: Array<{
      name: string;
      total: number;
      used: number;
      remaining: number;
      shared: boolean;
    }>;
    status: string;
  }

  // 選擇訂單
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setCurrentStep(3);
  };

  // 提交跨轉單請求
  const handleSubmitRequest = () => {
    setCurrentStep(4);
    // 這裡會實際處理提交邏輯
  };

  // 確認身份驗證
  const handleVerifyIdentity = () => {
    setShowVerificationPanel(false);
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>跨轉單處理系統 | BU3→BU1 轉單</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-2xl font-bold text-gray-900">跨轉單處理系統</h1>
          <p className="mt-1 text-sm text-gray-600">BU3→BU1 消耗方操作流程</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">
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
      </main>
    </div>
  );
}