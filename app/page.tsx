
"use client";

// app/cross-unit-transfer-approval/page.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CrossUnitTransferApproval() {
  // 跨轉單請求列表
  const [transferRequests, setTransferRequests] = useState([
    {
      id: 'CTR-20240309-001',
      requestTime: '2024-03-09 10:15',
      status: '待審核',
      consumer: '愛美肌',
      member: '王小明',
      phone: '0912345678',
      orderId: 'SO-20240210-042',
      course: '保濕護理課程',
      amount: 1,
      remainingAfter: 2,
      requestNote: '客戶居住地靠近愛美肌分店，要求在此進行療程'
    },
    {
      id: 'CTR-20240309-002',
      requestTime: '2024-03-09 11:30',
      status: '待審核',
      consumer: '漾澤',
      member: '李小華',
      phone: '0987654321',
      orderId: 'SO-20240301-015',
      course: '肌膚緊緻課程',
      amount: 2,
      remainingAfter: 3,
      requestNote: '客戶臨時需求，請盡快審核'
    },
    {
      id: 'CTR-20240308-005',
      requestTime: '2024-03-08 16:45',
      status: '已審核',
      consumer: '愛美肌',
      member: '陳美麗',
      phone: '0922334455',
      orderId: 'SO-20240225-033',
      course: '美白調理課程',
      amount: 1,
      remainingAfter: 4,
      requestNote: '',
      approveTime: '2024-03-08 17:20',
      approveNote: '已確認課程內容與剩餘次數'
    }
  ]);

  // 歷史審核記錄
  const [approvalHistory, setApprovalHistory] = useState([
    {
      id: 'CTR-20240308-001',
      requestTime: '2024-03-08 09:10',
      status: '已審核',
      consumer: '漾澤',
      member: '林小花',
      orderId: 'SO-20240220-019',
      course: '保濕護理課程',
      amount: 1,
      approveTime: '2024-03-08 10:05',
      approver: '王經理',
      approveNote: '已電話確認客戶需求'
    },
    {
      id: 'CTR-20240307-003',
      requestTime: '2024-03-07 14:20',
      status: '已拒絕',
      consumer: '愛美肌',
      member: '張大明',
      orderId: 'SO-20240215-027',
      course: '美白調理課程',
      amount: 3,
      approveTime: '2024-03-07 15:30',
      approver: '李主管',
      approveNote: '課程剩餘次數不足，已與消耗方溝通'
    }
  ]);

  // 當前選中的審核請求
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  // 審核類型 (approve/reject)
  const [approvalType, setApprovalType] = useState('');
  // 審核備註
  const [approvalNote, setApprovalNote] = useState('');
  // 顯示審核彈窗
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  // 顯示詳情彈窗
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  // 顯示確認彈窗
  const [showConfirmation, setShowConfirmation] = useState(false);
  // 顯示歷史記錄
  const [showHistory, setShowHistory] = useState(false);
  // 錯誤消息
  const [errorMessage, setErrorMessage] = useState('');

  // 篩選狀態
  const [filterStatus, setFilterStatus] = useState('待審核');

  // 獲取過濾後的請求列表
  const filteredRequests = transferRequests.filter(request => 
    filterStatus === 'all' ? true : request.status === filterStatus
  );

  // 處理審核操作
  interface TransferRequest {
      id: string;
      requestTime: string;
      status: string;
      consumer: string;
      member: string;
      phone?: string;
      orderId: string;
      course: string;
      amount: number;
      remainingAfter?: number;
      requestNote?: string;
      approveTime?: string;
      approveNote?: string;
      approver?: string;
    }
  
  const handleApprove = (request: TransferRequest) => {
    setSelectedRequest(request);
    setApprovalType('approve');
    setApprovalNote('');
    setShowApprovalDialog(true);
  };

  // 處理拒絕操作
  const handleReject = (request: TransferRequest) => {
    setSelectedRequest(request);
    setApprovalType('reject');
    setApprovalNote('');
    setShowApprovalDialog(true);
  };

  // 提交審核結果
  const submitApproval = () => {
    if (!approvalNote.trim()) {
      setErrorMessage('請填寫審核備註');
      return;
    }

    // 顯示確認彈窗
    setShowConfirmation(true);
  };

  // 確認審核
  const confirmApproval = () => {
    if (!selectedRequest) return;
    
    // 更新請求狀態
    const updatedRequests = transferRequests.map(req => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: approvalType === 'approve' ? '已審核' : '已拒絕',
          approveTime: new Date().toLocaleString('zh-TW'),
          approveNote: approvalNote,
          approver: '王經理' // 假設當前用戶
        };
      }
      return req;
    });

    setTransferRequests(updatedRequests);
    
    // 添加到歷史記錄
    if (selectedRequest) {
      const historyItem = {
        ...selectedRequest,
        status: approvalType === 'approve' ? '已審核' : '已拒絕',
        approveTime: new Date().toLocaleString('zh-TW'),
        approver: '王經理',
        approveNote: approvalNote
      };
      
      setApprovalHistory([historyItem, ...approvalHistory]);
    }

    // 關閉所有彈窗
    setShowApprovalDialog(false);
    setShowConfirmation(false);
    setSelectedRequest(null);
    setErrorMessage('');
  };

  // 查看詳情
  const viewDetails = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>跨轉單審核系統 | 銷售方審核界面</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-2xl font-bold text-gray-900">跨轉單審核系統</h1>
          <p className="mt-1 text-sm text-gray-600">銷售方審核界面</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">
        {/* 頁籤切換 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setShowHistory(false)}
              className={`py-4 px-6 font-medium text-sm ${!showHistory 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              待審核請求
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`py-4 px-6 font-medium text-sm ${showHistory 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              審核歷史記錄
            </button>
          </nav>
        </div>

        {!showHistory ? (
          <>
            {/* 篩選器 */}
            <div className="mb-4 flex items-center">
              <label className="mr-2 text-sm font-medium text-gray-700">狀態：</label>
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
            
            {/* 待審核列表 */}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => viewDetails(request)}>
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
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === '待審核' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === '已審核' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === '待審核' ? (
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
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => viewDetails(history)}>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          history.status === '已審核' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
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

        {/* 審核彈窗 */}
        {showApprovalDialog && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-semibold mb-4">
                {approvalType === 'approve' ? '審核通過' : '拒絕請求'}
              </h2>
              
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">請求編號</p>
                    <p className="font-medium">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">會員姓名</p>
                    <p className="font-medium">{selectedRequest.member}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">消耗方</p>
                    <p className="font-medium">{selectedRequest.consumer}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">訂單編號</p>
                    <p className="font-medium">{selectedRequest.orderId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">消耗課程</p>
                    <p className="font-medium">{selectedRequest.course}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">消耗數量</p>
                    <p className="font-medium">{selectedRequest.amount}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {approvalType === 'approve' ? '審核備註' : '拒絕原因'}
                </label>
                <textarea 
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                  placeholder={approvalType === 'approve' ? '請填寫審核備註...' : '請填寫拒絕原因...'}
                />
                {errorMessage && (
                  <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={submitApproval}
                  className={`px-4 py-2 text-white rounded-md ${
                    approvalType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {approvalType === 'approve' ? '確認審核通過' : '確認拒絕'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 確認彈窗 */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center justify-center mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold mb-2 text-center">確認操作</h2>
              
              <p className="text-center text-gray-600 mb-6">
                您確定要{approvalType === 'approve' ? '通過' : '拒絕'}此跨轉單請求嗎？此操作無法撤銷。
              </p>
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={confirmApproval}
                  className={`px-4 py-2 text-white rounded-md ${
                    approvalType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 詳情彈窗 */}
        {showDetailsDialog && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold mb-4">跨轉單詳情</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedRequest.status === '待審核' ? 'bg-yellow-100 text-yellow-800' :
                  selectedRequest.status === '已審核' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">基本信息</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">請求編號</span>
                      <span className="font-medium text-sm">{selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">請求時間</span>
                      <span className="text-sm">{selectedRequest.requestTime}</span>
                    </div>
                    {selectedRequest.approveTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">審核時間</span>
                        <span className="text-sm">{selectedRequest.approveTime}</span>
                      </div>
                    )}
                    {selectedRequest.approver && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">審核人</span>
                        <span className="text-sm">{selectedRequest.approver}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">消耗信息</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">消耗方</span>
                      <span className="text-sm">{selectedRequest.consumer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">會員姓名</span>
                      <span className="font-medium text-sm">{selectedRequest.member}</span>
                    </div>
                    {selectedRequest.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">手機號碼</span>
                        <span className="text-sm">{selectedRequest.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">訂單編號</span>
                      <span className="text-sm">{selectedRequest.orderId}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">課程詳情</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">課程名稱</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">消耗數量</th>
                        {selectedRequest.remainingAfter !== undefined && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">消耗後剩餘</th>
                        )}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">共用課程</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 text-sm">{selectedRequest.course}</td>
                        <td className="px-4 py-2 text-sm">{selectedRequest.amount}</td>
                        {selectedRequest.remainingAfter !== undefined && (
                          <td className="px-4 py-2 text-sm">{selectedRequest.remainingAfter}</td>
                        )}
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">是</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {(selectedRequest.requestNote || selectedRequest.approveNote) && (
                <div className="mb-6 bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">備註信息</h3>
                  {selectedRequest.requestNote && (
                    <div className="mb-3">
                      <span className="text-gray-600 text-xs block mb-1">消耗方請求備註：</span>
                      <p className="text-sm bg-white p-2 rounded border border-gray-200">
                        {selectedRequest.requestNote || '無'}
                      </p>
                    </div>
                  )}
                  {selectedRequest.approveNote && (
                    <div>
                      <span className="text-gray-600 text-xs block mb-1">審核備註：</span>
                      <p className="text-sm bg-white p-2 rounded border border-gray-200">
                        {selectedRequest.approveNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowDetailsDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  關閉
                </button>
                {selectedRequest.status === '待審核' && (
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
      </main>
    </div>
  );
}