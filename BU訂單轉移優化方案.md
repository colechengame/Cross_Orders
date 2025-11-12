# BU 訂單轉移優化方案

> **版本**: v1.0
> **日期**: 2024-11-12
> **目標**: 簡化 BU1 ↔ BU3 課程消耗流程，實現自動訂單轉移

---

## 📋 目錄

1. [需求背景](#需求背景)
2. [現狀分析](#現狀分析)
3. [優化方案](#優化方案)
4. [功能設計](#功能設計)
5. [技術實現](#技術實現)
6. [流程演示](#流程演示)
7. [效益分析](#效益分析)

---

## 需求背景

### 業務場景

- **BU3（愛美肌）**: 銷售訂單給客戶
- **BU1（板橋醫美）**: 客戶實際到店消費課程
- **痛點**: 每次消耗都需要跨轉流程，效率低下

### 核心需求

1. **BU 切換搜尋**: BU1 能搜尋其他 BU（如 BU3）的會員
2. **自動訂單轉移**: 消耗時可選擇將訂單從 BU3 轉至 BU1
3. **簡化後續流程**: 轉移後，客戶再次消費時直接操作，無需跨轉
4. **財務結算**: 完整記錄轉移歷史，方便對帳

---

## 現狀分析

### 當前流程

```
BU1 操作人員想消耗 BU3 會員的課程：

Step 1: 查詢會員（只能查 BU1 會員）❌
Step 2: 選擇訂單（只能選 BU1 訂單）❌
Step 3: 填寫消耗數量
Step 4: 發起跨轉單 → 狀態：待審核 ⏰
Step 5: 等待 BU3 審核（數分鐘~數小時）⏰
Step 6: BU3 批准後才完成 ✅
Step 7: 下次客戶再來，重複 Step 1-6 ❌

總耗時：每次數分鐘~數小時
操作次數：每次消費都需要完整流程
```

### 問題點

| 問題 | 影響 |
|------|------|
| 無法跨 BU 搜尋會員 | 操作繁瑣，需要切換系統 |
| 每次都需要跨轉流程 | 效率低，客戶體驗差 |
| 需要等待審核 | 時間成本高 |
| 訂單歸屬不清 | 管理混亂，財務對帳困難 |
| 重複操作 | 人力浪費 |

---

## 優化方案

### 核心改變

```
優化後流程：

Step 1: 切換搜尋門市 [下拉選單: BU3 愛美肌] ✨
Step 2: 搜尋會員（可搜 BU3 會員）✅
Step 3: 選擇訂單（顯示 BU3 訂單）✅
Step 4: 填寫消耗 + ☑️ 轉移訂單至本門市 ✨
Step 5: 確認消耗 → 立即完成 ✅
        └─ 自動扣減課程
        └─ 訂單從 BU3 轉至 BU1
        └─ 記錄轉移歷史
        └─ 財務結算記錄

下次客戶再來：
  → 直接搜尋 BU1 會員
  → 直接消耗，無需跨轉 ✨

總耗時：首次約 1 分鐘，後續約 10 秒
效率提升：90%+
```

### 方案特點

- ✅ **靈活搜尋**: 支持跨 BU 搜尋會員
- ✅ **可選轉移**: 可選擇是否轉移訂單
- ✅ **一次轉移**: 轉移後無需重複跨轉
- ✅ **記錄完整**: 保留原銷售記錄 + 轉移歷史
- ✅ **財務清晰**: 自動生成結算報表

---

## 功能設計

### 1. BU 切換搜尋功能

#### UI 設計

```
┌─────────────────────────────────────┐
│ Step 1: 搜尋會員                     │
├─────────────────────────────────────┤
│                                      │
│ 搜尋門市：                           │
│ ┌─────────────────────────┐         │
│ │ 🏪 愛美肌 (BU3)      [▼] │         │
│ └─────────────────────────┘         │
│   選項：                             │
│   • 🏪 板橋醫美 (BU2)                │
│   • 🏪 愛美肌 (BU3) ✓ 當前選擇       │
│   • 🏪 漾澤 (BU4)                    │
│                                      │
│ 會員搜尋：                           │
│ ┌─────────────────────────┐         │
│ │ 🔍 姓名或手機            │         │
│ └─────────────────────────┘         │
│                      [搜尋會員]      │
│                                      │
│ 💡 目前搜尋：愛美肌 (BU3) 的會員     │
└─────────────────────────────────────┘
```

#### 功能說明

- **下拉選單**: 列出所有可選 BU（BU2, BU3, BU4）
- **搜尋範圍**: 根據選擇的 BU 搜尋對應會員
- **訂單顯示**: 搜尋到會員後，顯示該會員在該 BU 的訂單
- **提示訊息**: 清楚標示當前搜尋的 BU

---

### 2. 自動訂單轉移功能

#### UI 設計 - Step 3

```
┌────────────────────────────────────────────┐
│ Step 3: 確認消耗課程                        │
├────────────────────────────────────────────┤
│                                             │
│ 訂單資訊：                                  │
│ • 訂單號：SO-20241101-001                   │
│ • 銷售門市：愛美肌 (BU3)                    │
│ • 會員：王小美                              │
│                                             │
│ 消耗明細：                                  │
│ ┌─────────────────────────────────────┐    │
│ │ 肌膚緊緻課程  [3] 堂  (剩餘 10/總 15) │    │
│ │ 深層保濕課程  [2] 堂  (剩餘 5/總 10)  │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ ☑️ 轉移訂單至本門市                   │    │
│ │                                       │    │
│ │ 勾選後，此訂單將從「愛美肌」轉移至    │    │
│ │ 「板橋醫美」，後續消耗無需跨轉。      │    │
│ │                                       │    │
│ │ 轉移效果：                            │    │
│ │ • 訂單管理權轉至板橋醫美              │    │
│ │ • 財務結算自動記錄                    │    │
│ │ • 愛美肌保留「已轉出」記錄            │    │
│ └─────────────────────────────────────┘    │
│                                             │
│              [取消]  [確認消耗並轉移訂單]   │
└────────────────────────────────────────────┘
```

#### UI 設計 - Step 4（成功頁面）

**情況 A：有勾選轉移**

```
┌────────────────────────────────────────┐
│ ✅ 消耗並轉移成功！                     │
├────────────────────────────────────────┤
│                                         │
│ 消耗明細：                              │
│ • 肌膚緊緻課程：3 堂                    │
│ • 深層保濕課程：2 堂                    │
│ • 總計消耗：5 堂                        │
│                                         │
│ 訂單轉移：                              │
│ • 訂單 SO-20241101-001                  │
│ • 從「愛美肌」→「板橋醫美」             │
│ • 剩餘課程：5 堂                        │
│                                         │
│ 💡 後續提醒：                           │
│ 此訂單已轉入本門市，王小美後續來店      │
│ 消費時，直接搜尋「板橋醫美」的會員      │
│ 即可，無需再進行跨轉操作。              │
│                                         │
│            [查看訂單] [返回首頁]        │
└────────────────────────────────────────┘
```

**情況 B：未勾選轉移**

```
┌────────────────────────────────────────┐
│ ✅ 消耗成功！                           │
├────────────────────────────────────────┤
│                                         │
│ 消耗明細：                              │
│ • 肌膚緊緻課程：3 堂                    │
│ • 深層保濕課程：2 堂                    │
│ • 總計消耗：5 堂                        │
│                                         │
│ 訂單狀態：                              │
│ • 訂單仍屬「愛美肌」管理                │
│ • 已發送消耗通知至愛美肌                │
│                                         │
│ 💡 後續提醒：                           │
│ 王小美下次來店消費時，仍需搜尋          │
│ 「愛美肌」會員並進行跨轉消耗。          │
│                                         │
│            [返回首頁]                   │
└────────────────────────────────────────┘
```

---

### 3. 訂單管理視圖

#### BU3（愛美肌）- 銷售方視圖

```
┌────────────────────────────────────────────────────┐
│ 愛美肌訂單管理                                      │
├────────────────────────────────────────────────────┤
│                                                     │
│ 篩選： [全部訂單 ▼]  [搜尋...]                     │
│        └─ 有效訂單                                  │
│           已轉出訂單                                │
│           全部訂單                                  │
│                                                     │
│ 【有效訂單】                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ SO-001 │ 王小美 │ 肌膚課程 10堂 │ [查看]    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 【已轉出訂單】                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📤 SO-002 │ 李小華 │ 已轉至：板橋醫美       │   │
│ │            轉出日期：2024-11-12               │   │
│ │            剩餘課程：5堂                       │   │
│ │                              [查看轉移記錄]   │   │
│ └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

**轉移記錄詳情彈窗**

```
┌────────────────────────────────────────┐
│ 訂單轉移詳情                            │
├────────────────────────────────────────┤
│                                         │
│ 訂單資訊：                              │
│ • 訂單號：SO-002                        │
│ • 會員：李小華                          │
│ • 原銷售門市：愛美肌 (BU3)              │
│                                         │
│ 轉移資訊：                              │
│ • 轉入門市：板橋醫美 (BU1)              │
│ • 轉移時間：2024-11-12 14:30            │
│ • 操作人員：張店長                      │
│ • 轉移原因：消耗時自動轉移              │
│                                         │
│ 轉移時消耗明細：                        │
│ ┌──────────────────────────────┐       │
│ │ 課程名稱     │ 消耗 │ 轉移前 │ 轉移後│       │
│ ├──────────────────────────────┤       │
│ │ 肌膚緊緻     │  3   │  10   │  7   │       │
│ │ 深層保濕     │  2   │  5    │  3   │       │
│ └──────────────────────────────┘       │
│                                         │
│ 財務結算：                              │
│ • 應轉業績：5 堂課（轉移時消耗）        │
│ • 剩餘管理：10 堂課（轉給板橋醫美）     │
│                                         │
│                       [關閉] [匯出]     │
└────────────────────────────────────────┘
```

---

#### BU1（板橋醫美）- 消耗方視圖

```
┌────────────────────────────────────────────────────┐
│ 板橋醫美訂單管理                                    │
├────────────────────────────────────────────────────┤
│                                                     │
│ 篩選： [全部訂單 ▼]  [搜尋...]                     │
│        └─ 本店銷售                                  │
│           轉入訂單                                  │
│           全部訂單                                  │
│                                                     │
│ 【本店銷售】                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ SO-100 │ 陳小明 │ 美白課程 8堂 │ [查看]    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 【轉入訂單】                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📥 SO-002 │ 李小華 │ 由愛美肌轉入           │   │
│ │            轉入日期：2024-11-12               │   │
│ │            剩餘課程：5堂                       │   │
│ │            原銷售：愛美肌                      │   │
│ │                         [查看] [直接消耗]     │   │
│ └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

**轉入訂單的直接消耗功能**

```
┌────────────────────────────────────────┐
│ 消耗課程 - SO-002                       │
├────────────────────────────────────────┤
│                                         │
│ 會員：李小華                            │
│ 訂單來源：愛美肌轉入                    │
│                                         │
│ 可消耗課程：                            │
│ ┌──────────────────────────────┐       │
│ │ 肌膚緊緻  [__] 堂  (剩餘 7)   │       │
│ │ 深層保濕  [__] 堂  (剩餘 3)   │       │
│ └──────────────────────────────┘       │
│                                         │
│ 💡 此為轉入訂單，直接消耗即可，         │
│    無需跨轉流程。                       │
│                                         │
│              [取消]  [確認消耗]         │
└────────────────────────────────────────┘
```

---

### 4. 財務結算報表

```
┌────────────────────────────────────────────────────┐
│ 📊 訂單轉移財務報表                                 │
├────────────────────────────────────────────────────┤
│                                                     │
│ 時間範圍： [2024-11-01] ~ [2024-11-30]  [查詢]    │
│                                                     │
│ 【BU3 愛美肌 - 轉出統計】                           │
│ ┌─────────────────────────────────────────────┐   │
│ │ 轉出門市     │ 訂單數 │ 轉出堂數 │ 財務結算  │   │
│ ├─────────────────────────────────────────────┤   │
│ │ 板橋醫美 BU1 │   15   │   78     │ 待結算   │   │
│ │ 漾澤 BU4     │    8   │   42     │ 已結算   │   │
│ │ 總計         │   23   │  120     │          │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 【BU1 板橋醫美 - 轉入統計】                         │
│ ┌─────────────────────────────────────────────┐   │
│ │ 轉入來源     │ 訂單數 │ 轉入堂數 │ 財務結算  │   │
│ ├─────────────────────────────────────────────┤   │
│ │ 愛美肌 BU3   │   15   │   78     │ 待結算   │   │
│ │ 總計         │   15   │   78     │          │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│              [匯出 Excel] [匯出 PDF] [列印]        │
└────────────────────────────────────────────────────┘
```

---

## 技術實現

### 數據結構設計

#### 1. 訂單模型（擴展）

```typescript
interface IOrder {
  // 原有欄位
  id: string;
  memberName: string;
  phone: string;
  store: string;              // 當前管理門市
  items: IOrderItem[];

  // 新增欄位
  originalStore?: string;     // 原始銷售門市
  transferredFrom?: string;   // 從哪個門市轉入
  transferredTo?: string;     // 轉出到哪個門市
  transferDate?: string;      // 轉移日期
  transferReason?: string;    // 轉移原因
  isTransferred: boolean;     // 是否已轉移（預設 false）
}
```

#### 2. 轉移記錄模型（新增）

```typescript
interface IOrderTransferRecord {
  id: string;                 // 轉移記錄 ID (TRF-YYYYMMDD-XXX)
  orderId: string;            // 訂單 ID
  fromStore: string;          // 轉出門市
  toStore: string;            // 轉入門市
  transferDate: string;       // 轉移時間
  operator: string;           // 操作人員
  reason: string;             // 轉移原因

  // 轉移時的消耗明細
  consumptionAtTransfer: {
    courseName: string;
    consumed: number;
    remainingBefore: number;
    remainingAfter: number;
  }[];

  totalConsumedAtTransfer: number; // 轉移時總消耗
  totalRemainingAfter: number;     // 轉移後剩餘
}
```

#### 3. BU 選項配置

```typescript
interface IBUOption {
  value: string;    // BU 名稱（如：愛美肌）
  label: string;    // 顯示文字（如：🏪 愛美肌 (BU3)）
  code: string;     // BU 代碼（如：BU3）
}

const buOptions: IBUOption[] = [
  { value: "板橋醫美", label: "🏪 板橋醫美 (BU2)", code: "BU2" },
  { value: "愛美肌", label: "🏪 愛美肌 (BU3)", code: "BU3" },
  { value: "漾澤", label: "🏪 漾澤 (BU4)", code: "BU4" },
];
```

---

### 核心邏輯實現

#### 1. BU 切換搜尋

```typescript
// 狀態管理
const [searchBU, setSearchBU] = useState<string>("愛美肌");
const [memberSearchInput, setMemberSearchInput] = useState("");
const [searchResults, setSearchResults] = useState<IMember[]>([]);
const [availableOrders, setAvailableOrders] = useState<IOrder[]>([]);

// 搜尋會員邏輯
const handleSearchMember = (): void => {
  // 1. 根據選擇的 BU 搜尋會員
  const results = mockMembers.filter(member =>
    member.mainStore === searchBU && // 篩選該 BU 的會員
    (member.name.includes(memberSearchInput) ||
     member.phone.includes(memberSearchInput))
  );

  setSearchResults(results);

  // 2. 如果找到會員，顯示該會員在該 BU 的訂單
  if (results.length > 0) {
    const member = results[0];
    const orders = mockOrders.filter(order =>
      order.memberName === member.name &&
      order.store === searchBU && // 該 BU 的訂單
      !order.isTransferred        // 未轉出的訂單
    );
    setAvailableOrders(orders);
    setCurrentStep(2); // 進入選擇訂單步驟
  } else {
    setErrorMessage("未找到符合條件的會員");
  }
};

// BU 切換處理
const handleBUChange = (newBU: string): void => {
  setSearchBU(newBU);
  setMemberSearchInput("");
  setSearchResults([]);
  setAvailableOrders([]);
  setErrorMessage("");
};
```

#### 2. 訂單轉移邏輯

```typescript
// 狀態管理
const [shouldTransferOrder, setShouldTransferOrder] = useState<boolean>(false);

// 消耗並轉移訂單
const handleConsumptionWithTransfer = (): void => {
  // 1. 驗證消耗數量
  if (!validateConsumption()) {
    setErrorMessage("消耗數量驗證失敗");
    return;
  }

  if (!selectedOrder) return;

  // 2. 計算更新後的課程項目
  const updatedItems = selectedOrder.items.map(item => ({
    ...item,
    used: item.used + (consumptionValues[item.name] || 0),
    remaining: item.remaining - (consumptionValues[item.name] || 0)
  }));

  const totalConsumed = Object.values(consumptionValues)
    .reduce((sum, val) => sum + val, 0);

  const totalRemaining = updatedItems
    .reduce((sum, item) => sum + item.remaining, 0);

  // 3. 創建消耗記錄
  const consumptionRecord = createConsumptionRecord({
    orderId: selectedOrder.id,
    member: mockMemberData.name,
    courses: Object.entries(consumptionValues)
      .filter(([_, v]) => v > 0)
      .map(([name, consumed]) => ({
        courseName: name,
        consumed,
        remainingBefore: selectedOrder.items.find(i => i.name === name)!.remaining,
        remainingAfter: selectedOrder.items.find(i => i.name === name)!.remaining - consumed,
      })),
    totalConsumed,
  });

  // 4. 如果勾選「轉移訂單」
  if (shouldTransferOrder) {
    const now = new Date();
    const transferId = `TRF-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${
      Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    }`;

    // 4.1 創建轉移記錄
    const transferRecord: IOrderTransferRecord = {
      id: transferId,
      orderId: selectedOrder.id,
      fromStore: selectedOrder.store,      // BU3 愛美肌
      toStore: userDepartment,             // BU1 板橋醫美
      transferDate: now.toISOString(),
      operator: currentUser.name,
      reason: "消耗時自動轉移至消費門市",
      consumptionAtTransfer: consumptionRecord.courses,
      totalConsumedAtTransfer: totalConsumed,
      totalRemainingAfter: totalRemaining,
    };

    // 4.2 更新訂單狀態（轉移後的訂單）
    const transferredOrder: IOrder = {
      ...selectedOrder,
      items: updatedItems,
      store: userDepartment,               // 新管理門市：BU1
      originalStore: selectedOrder.store,  // 原銷售門市：BU3
      transferredFrom: selectedOrder.store,
      transferDate: transferRecord.transferDate,
      transferReason: transferRecord.reason,
      isTransferred: true,
    };

    // 4.3 更新 BU1 訂單列表（新增轉入訂單）
    setOrders(prev => ({
      ...prev,
      [userDepartment]: [...(prev[userDepartment] || []), transferredOrder]
    }));

    // 4.4 更新 BU3 訂單列表（標記為已轉出）
    setOrders(prev => ({
      ...prev,
      [selectedOrder.store]: prev[selectedOrder.store].map(order =>
        order.id === selectedOrder.id
          ? {
              ...order,
              items: updatedItems,
              transferredTo: userDepartment,
              transferDate: transferRecord.transferDate,
              isTransferred: true,
            }
          : order
      )
    }));

    // 4.5 記錄轉移歷史
    setTransferHistory(prev => [transferRecord, ...prev]);

    // 4.6 顯示成功訊息（包含轉移資訊）
    setSuccessMessage({
      type: 'with-transfer',
      consumedTotal: totalConsumed,
      remainingTotal: totalRemaining,
      order: transferredOrder,
      transferRecord: transferRecord,
    });
  } else {
    // 未勾選轉移，僅更新訂單剩餘堂數
    setOrders(prev => ({
      ...prev,
      [selectedOrder.store]: prev[selectedOrder.store].map(order =>
        order.id === selectedOrder.id
          ? { ...order, items: updatedItems }
          : order
      )
    }));

    // 顯示成功訊息（不含轉移資訊）
    setSuccessMessage({
      type: 'without-transfer',
      consumedTotal: totalConsumed,
      remainingTotal: totalRemaining,
    });
  }

  // 5. 重置狀態，進入完成步驟
  setCurrentStep(4);
  setErrorMessage("");
};

// 驗證消耗數量
const validateConsumption = (): boolean => {
  if (!selectedOrder) return false;

  const hasSelected = Object.values(consumptionValues).some(val => val > 0);
  if (!hasSelected) {
    setErrorMessage("請至少選擇一項課程進行消耗");
    return false;
  }

  for (const item of selectedOrder.items) {
    const needed = consumptionValues[item.name] || 0;
    if (needed > item.remaining) {
      setErrorMessage(`${item.name} 的消耗數量不能超過剩餘數量 ${item.remaining}`);
      return false;
    }
  }

  return true;
};
```

#### 3. 生成唯一 ID

```typescript
const generateTransferId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `TRF-${dateStr}-${randomNum}`;
};
```

---

### UI 組件實現

#### 1. BU 選擇下拉選單

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
    搜尋門市：
  </label>
  <select
    value={searchBU}
    onChange={(e) => handleBUChange(e.target.value)}
    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600
               rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
               focus:outline-none focus:ring-2 focus:ring-amber-500"
  >
    {buOptions.map(option => (
      <option key={option.code} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
    💡 目前搜尋：{searchBU} 的會員
  </p>
</div>
```

#### 2. 訂單轉移勾選框

```tsx
<div className="mt-6 p-4 bg-amber-50 dark:bg-stone-700 rounded-lg border border-amber-200 dark:border-amber-800">
  <label className="flex items-start cursor-pointer">
    <input
      type="checkbox"
      checked={shouldTransferOrder}
      onChange={(e) => setShouldTransferOrder(e.target.checked)}
      className="mt-1 mr-3 h-5 w-5 text-amber-600 focus:ring-amber-500
                 border-stone-300 rounded"
    />
    <div className="flex-1">
      <div className="font-medium text-stone-900 dark:text-stone-100">
        轉移訂單至本門市
      </div>
      <div className="mt-2 text-sm text-stone-700 dark:text-stone-300">
        <p>勾選後，此訂單將從「{selectedOrder?.store}」轉移至「{userDepartment}」，
           後續消耗無需跨轉。</p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>訂單管理權轉至 {userDepartment}</li>
          <li>財務結算自動記錄</li>
          <li>{selectedOrder?.store} 保留「已轉出」記錄</li>
        </ul>
      </div>
    </div>
  </label>
</div>
```

#### 3. 成功訊息顯示

```tsx
{successMessage && (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800
                  rounded-lg p-6">
    <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-4">
      ✅ {successMessage.type === 'with-transfer' ? '消耗並轉移成功！' : '消耗成功！'}
    </h3>

    <div className="space-y-4">
      {/* 消耗明細 */}
      <div>
        <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
          消耗明細：
        </h4>
        <ul className="ml-4 space-y-1 text-stone-700 dark:text-stone-300">
          {Object.entries(consumptionValues)
            .filter(([_, v]) => v > 0)
            .map(([name, count]) => (
              <li key={name}>• {name}：{count} 堂</li>
            ))}
          <li className="font-medium">• 總計消耗：{successMessage.consumedTotal} 堂</li>
        </ul>
      </div>

      {/* 轉移資訊（僅轉移時顯示） */}
      {successMessage.type === 'with-transfer' && (
        <div>
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
            訂單轉移：
          </h4>
          <ul className="ml-4 space-y-1 text-stone-700 dark:text-stone-300">
            <li>• 訂單 {successMessage.order.id}</li>
            <li>• 從「{successMessage.transferRecord.fromStore}」→「{successMessage.transferRecord.toStore}」</li>
            <li>• 剩餘課程：{successMessage.remainingTotal} 堂</li>
          </ul>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>後續提醒：</strong>此訂單已轉入本門市，
              {mockMemberData.name}後續來店消費時，直接搜尋「{userDepartment}」的會員即可，
              無需再進行跨轉操作。
            </p>
          </div>
        </div>
      )}

      {/* 未轉移提醒 */}
      {successMessage.type === 'without-transfer' && (
        <div>
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
            訂單狀態：
          </h4>
          <ul className="ml-4 space-y-1 text-stone-700 dark:text-stone-300">
            <li>• 訂單仍屬「{selectedOrder?.store}」管理</li>
            <li>• 已發送消耗通知至 {selectedOrder?.store}</li>
          </ul>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 <strong>後續提醒：</strong>{mockMemberData.name}下次來店消費時，
              仍需搜尋「{selectedOrder?.store}」會員並進行跨轉消耗。
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="mt-6 flex gap-3">
      {successMessage.type === 'with-transfer' && (
        <button
          onClick={() => viewOrderDetails(successMessage.order)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          查看訂單
        </button>
      )}
      <button
        onClick={resetToInitial}
        className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700"
      >
        返回首頁
      </button>
    </div>
  </div>
)}
```

---

## 流程演示

### 完整操作流程

#### 場景：BU1 消耗 BU3 會員的課程並轉移訂單

```
【操作步驟】

Step 1: BU1 操作人員登入系統
  └─ 進入「消耗方操作介面」

Step 2: 切換搜尋門市
  └─ 點擊「搜尋門市」下拉選單
  └─ 選擇「🏪 愛美肌 (BU3)」
  └─ 系統提示：目前搜尋 BU3 的會員

Step 3: 搜尋會員
  └─ 輸入會員姓名「李小華」或手機號
  └─ 點擊「搜尋會員」
  └─ 系統搜尋 BU3 的會員資料庫
  └─ 找到會員「李小華」

Step 4: 選擇訂單
  └─ 系統顯示李小華在 BU3 的所有有效訂單
  └─ 選擇訂單「SO-002」
  └─ 系統顯示訂單詳情和可消耗課程

Step 5: 填寫消耗數量
  └─ 肌膚緊緻課程：輸入 3 堂（剩餘 10）
  └─ 深層保濕課程：輸入 2 堂（剩餘 5）
  └─ 總計消耗：5 堂

Step 6: 選擇是否轉移訂單
  └─ ☑️ 勾選「轉移訂單至本門市」
  └─ 系統顯示轉移說明和效果

Step 7: 確認消耗
  └─ 點擊「確認消耗並轉移訂單」

【系統自動執行】

  ✅ 驗證消耗數量（不超過剩餘）
  ✅ 扣減課程堂數
    ├─ 肌膚緊緻：10 → 7 堂
    └─ 深層保濕：5 → 3 堂
  ✅ 創建消耗記錄
  ✅ 創建轉移記錄（TRF-20241112-001）
  ✅ 更新訂單狀態
    ├─ 當前管理門市：BU3 → BU1
    ├─ 原銷售門市：BU3（保留）
    ├─ 標記為已轉移
    └─ 記錄轉移時間和操作人
  ✅ 更新 BU1 訂單列表
    └─ 新增轉入訂單 SO-002
  ✅ 更新 BU3 訂單列表
    └─ SO-002 標記為「已轉出」
  ✅ 記錄轉移歷史
  ✅ 生成財務結算記錄

Step 8: 顯示成功訊息
  ✅ 消耗並轉移成功！
  └─ 顯示消耗明細
  └─ 顯示轉移資訊
  └─ 提示後續無需跨轉

【後續效果】

李小華下次來 BU1 消費：
  Step 1: 切換搜尋門市 → 選擇「板橋醫美 BU1」
  Step 2: 搜尋會員「李小華」
  Step 3: 找到訂單 SO-002（📥 轉入訂單）
  Step 4: 點擊「直接消耗」
  Step 5: 填寫消耗數量 → 確認
  Step 6: ✅ 完成（無需跨轉流程）

總耗時：約 10 秒 ✨
```

---

### 流程對比

| 項目 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| **首次操作** |  |  |  |
| - 搜尋會員 | 需切換系統/詢問 | 下拉選單切換 BU | ✅ 便利 |
| - 跨轉流程 | 發起 → 等待審核 | 勾選轉移選項 | ✅ 簡化 |
| - 完成時間 | 數分鐘~數小時 | 約 1 分鐘 | ⬇️ 90% |
| **後續操作** |  |  |  |
| - 搜尋會員 | 每次都要跨 BU | 直接搜本 BU | ✅ 便利 |
| - 跨轉流程 | 每次都要跨轉 | 無需跨轉 | ⬇️ 100% |
| - 完成時間 | 數分鐘~數小時 | 約 10 秒 | ⬇️ 99% |
| **管理效率** |  |  |  |
| - 訂單歸屬 | 散落各 BU | 集中到消費 BU | ✅ 清晰 |
| - 財務對帳 | 手動統計 | 自動報表 | ✅ 準確 |
| - 記錄追蹤 | 困難 | 完整歷史 | ✅ 可靠 |

---

## 效益分析

### 1. 操作效率提升

- **首次消耗**：從 5 分鐘 → 1 分鐘（⬇️ 80%）
- **後續消耗**：從 5 分鐘 → 10 秒（⬇️ 99%）
- **整體效率**：假設客戶平均消費 5 次，總耗時從 25 分鐘 → 1.5 分鐘（⬇️ 94%）

### 2. 人力成本節省

假設：
- BU1 每天處理 20 次跨 BU 消耗
- 每次節省 4 分鐘
- 每天節省：20 × 4 = 80 分鐘
- 每月節省：80 × 30 = 2400 分鐘 = 40 小時
- **相當於每月節省 1 位員工工作週**

### 3. 客戶體驗改善

- **等待時間**：從數小時 → 0（⬇️ 100%）
- **操作透明度**：立即知道結果，無需等待通知
- **便利性**：後續消費無需重複流程

### 4. 管理效益

- **訂單管理**：集中化，減少跨 BU 協調
- **財務結算**：自動化報表，減少人工統計錯誤
- **數據追蹤**：完整的轉移歷史，易於審計

### 5. 風險降低

- **數據一致性**：單一來源，減少同步錯誤
- **記錄完整性**：保留轉移歷史，可追溯
- **財務準確性**：自動計算，減少人為錯誤

---

## 實施計畫

### 階段一：核心功能開發（Week 1-2）

#### 優先級 P0（必須）
- [ ] 實現 BU 切換搜尋下拉選單
- [ ] 實現跨 BU 會員搜尋邏輯
- [ ] 實現訂單轉移勾選框
- [ ] 實現訂單轉移核心邏輯
- [ ] 更新訂單數據結構
- [ ] 創建轉移記錄模型

#### 優先級 P1（重要）
- [ ] 實現轉移成功/失敗訊息顯示
- [ ] 實現 BU3「已轉出訂單」視圖
- [ ] 實現 BU1「轉入訂單」視圖
- [ ] 實現轉入訂單的「直接消耗」功能

---

### 階段二：報表與管理（Week 3-4）

#### 優先級 P1（重要）
- [ ] 實現轉移記錄詳情彈窗
- [ ] 實現訂單轉移財務報表
- [ ] 實現報表匯出功能（Excel/PDF）
- [ ] 實現轉出/轉入統計面板

#### 優先級 P2（優化）
- [ ] 實現搜尋/篩選功能
- [ ] 實現訂單狀態篩選（有效/已轉出/已轉入）
- [ ] 實現批量操作功能

---

### 階段三：測試與優化（Week 5）

#### 測試項目
- [ ] 單元測試：核心邏輯函數
- [ ] 整合測試：完整流程測試
- [ ] UI 測試：各種螢幕尺寸
- [ ] 數據測試：邊界條件、異常情況
- [ ] 性能測試：大量訂單時的效能

#### 優化項目
- [ ] 代碼重構與優化
- [ ] 性能優化（如：大量訂單時的渲染）
- [ ] UI/UX 優化
- [ ] 錯誤處理完善
- [ ] 文檔完善

---

### 階段四：上線與監控（Week 6）

- [ ] 生產環境部署
- [ ] 用戶培訓
- [ ] 監控與日誌
- [ ] 收集用戶反饋
- [ ] 持續優化

---

## 注意事項

### 開發注意點

1. **數據一致性**
   - 確保轉移操作的原子性
   - 轉移失敗時要能完整回滾
   - 考慮併發情況下的數據衝突

2. **權限控制**
   - 確保只有授權人員能轉移訂單
   - 記錄操作人員資訊
   - 實現操作日誌

3. **錯誤處理**
   - 網路錯誤時的重試機制
   - 清晰的錯誤訊息提示
   - 失敗時的補救方案

4. **性能考量**
   - 大量訂單時的分頁加載
   - 搜尋功能的防抖優化
   - 報表生成的異步處理

### 業務注意點

1. **財務結算**
   - 明確轉移時的業績歸屬規則
   - 建立定期對帳機制
   - 處理異議和糾紛的流程

2. **用戶培訓**
   - 提供操作手冊
   - 進行現場培訓
   - 設置常見問題 FAQ

3. **過渡期管理**
   - 舊系統和新系統並行運行
   - 逐步遷移歷史數據
   - 保留回退方案

---

## 技術債務

### 當前限制

1. **前端限制**
   - 目前為純前端實現，數據存儲在 state
   - 刷新頁面後數據會丟失
   - 無法跨設備/瀏覽器同步

2. **建議後續改進**
   - 實現後端 API 持久化數據
   - 使用資料庫存儲訂單和轉移記錄
   - 實現實時同步機制（WebSocket）
   - 加入用戶認證和權限控制

---

## 附錄

### A. 相關文件

- 產品需求文檔（PRD）
- API 接口文檔
- 數據庫設計文檔
- 測試用例文檔

### B. 參考資源

- React 官方文檔
- TypeScript 官方文檔
- Tailwind CSS 文檔

### C. 版本歷史

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|---------|
| v1.0 | 2024-11-12 | Claude | 初始版本 |

---

## 總結

本方案通過引入 **BU 切換搜尋** 和 **自動訂單轉移** 功能，有效解決了跨 BU 課程消耗的效率問題：

- ✅ **首次消耗時間** 從數小時縮短至 1 分鐘
- ✅ **後續消耗時間** 從數分鐘縮短至 10 秒
- ✅ **整體效率提升** 90%+
- ✅ **客戶體驗** 大幅改善
- ✅ **管理效率** 顯著提高
- ✅ **財務對帳** 更加準確

預期實施週期為 **4-6 週**，投入產出比高，建議優先實施。
