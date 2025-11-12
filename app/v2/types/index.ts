/**
 * Cross Orders B 版 - 核心類型定義
 * 完全重寫，基於新方案設計
 */

// ============================================================================
// BU（Business Unit）相關
// ============================================================================

export type BUCode = 'BU1' | 'BU2' | 'BU3' | 'BU4';

export interface IBU {
  code: BUCode;
  name: string;
  displayName: string;
  icon?: string;
}

// ============================================================================
// 會員相關
// ============================================================================

export interface IMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;

  // 會員歸屬
  mainStore: string;           // 主建檔門市
  relatedStores: string[];     // 關聯門市

  // 會員等級（各 BU 獨立）
  levels?: Record<BUCode, string>;

  // 會員積分（各 BU 獨立）
  points?: Record<BUCode, number>;

  // 建檔資訊
  createdAt: string;
  createdBy: string;
  createdStore: string;

  // 最後更新
  updatedAt?: string;
  updatedBy?: string;
}

// ============================================================================
// 會員綁定相關
// ============================================================================

export type LinkType = 'auto' | 'strong';
export type LinkStatus = 'linked' | 'strong-linked' | 'unlinked';

export interface IMemberLink {
  linkId: string;
  linkType: LinkType;
  linkStatus: LinkStatus;
  linkDate: string;

  // 綁定的會員資訊
  members: {
    bu: BUCode;
    memberId: string;
    memberName: string;
    phone: string;
  }[];

  // 匹配條件
  matchCriteria: {
    nameMatch: boolean;
    phoneMatch: boolean;
    matchScore: number;        // 0-100
  };

  // 同步設定（僅強綁定有效）
  syncEnabled: boolean;
  syncDirection?: 'bidirectional' | 'one-way';
  masterDataSource?: BUCode;
  syncFields?: string[];

  // 操作資訊（僅強綁定有）
  operator?: string;
  operatorBU?: BUCode;
  strongLinkDate?: string;
}

// ============================================================================
// 訂單相關
// ============================================================================

export interface IOrderItem {
  itemId: string;
  name: string;               // 課程名稱
  productCode: string;        // 產品代碼
  category: string;           // 課程類別
  total: number;              // 總堂數
  used: number;               // 已使用
  remaining: number;          // 剩餘
  unitPrice?: number;         // 單價
  shared: boolean;            // 是否為共用課程

  // 課程有效期
  validFrom?: string;
  validUntil?: string;
}

export interface IOrder {
  id: string;
  orderNumber: string;        // 訂單編號
  memberName: string;
  phone: string;
  memberId: string;

  // 訂單歸屬
  store: string;              // 當前管理門市
  originalStore: string;      // 原始銷售門市

  // 訂單狀態
  status: 'active' | 'completed' | 'cancelled' | 'transferred';

  // 訂單項目
  items: IOrderItem[];

  // 訂單金額
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  // 訂單時間
  orderDate: string;
  createdAt: string;
  updatedAt?: string;

  // 銷售資訊
  consultant?: string;        // 諮詢師
  salesperson?: string;       // 銷售人員

  // 轉移相關
  isTransferred: boolean;
  transferredFrom?: string;   // 從哪個門市轉入
  transferredTo?: string;     // 轉出到哪個門市
  transferDate?: string;
  transferredBy?: string;     // 操作人員
}

// ============================================================================
// 訂單轉移相關
// ============================================================================

export interface IOrderTransferRecord {
  id: string;
  transferNumber: string;     // 轉移單號 (TRF-YYYYMMDD-XXX)

  // 訂單資訊
  orderId: string;
  orderNumber: string;

  // 會員資訊
  memberId: string;
  memberName: string;
  phone: string;

  // 轉移資訊
  fromStore: string;          // 轉出門市
  toStore: string;            // 轉入門市
  transferDate: string;
  operator: string;           // 操作人員
  operatorBU: BUCode;

  // 轉移原因
  reason: string;
  reasonType: 'consumption' | 'relocation' | 'request' | 'other';

  // 轉移時的消耗明細
  consumptionAtTransfer?: {
    courseName: string;
    productCode: string;
    consumed: number;
    remainingBefore: number;
    remainingAfter: number;
  }[];

  // 轉移時的統計
  totalConsumedAtTransfer?: number;
  totalRemainingAfter: number;

  // 轉移狀態
  status: 'pending' | 'completed' | 'cancelled';

  // 備註
  note?: string;

  // 時間戳
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// 消耗記錄相關
// ============================================================================

export interface IConsumptionRecord {
  id: string;
  recordNumber: string;       // 消耗單號 (CON-YYYYMMDD-XXX)

  // 訂單資訊
  orderId: string;
  orderNumber: string;

  // 會員資訊
  memberId: string;
  memberName: string;
  phone: string;

  // 消耗門市
  consumptionStore: string;
  consumptionBU: BUCode;

  // 操作資訊
  operator: string;           // 操作人員
  operatorBU: BUCode;

  // 消耗明細
  items: {
    itemId: string;
    courseName: string;
    productCode: string;
    consumed: number;
    remainingBefore: number;
    remainingAfter: number;
    unitPrice?: number;
  }[];

  // 總計
  totalConsumed: number;
  totalValue?: number;

  // 是否涉及跨轉
  isCrossBU: boolean;
  originalStore?: string;     // 原訂單所屬門市

  // 是否涉及訂單轉移
  includesTransfer: boolean;
  transferRecordId?: string;

  // 消耗時間
  consumptionDate: string;
  createdAt: string;

  // 備註
  note?: string;
}

// ============================================================================
// 搜尋相關
// ============================================================================

export interface IMemberSearchQuery {
  keyword: string;            // 姓名或手機
  searchBU?: BUCode;          // 搜尋哪個 BU
  fuzzyMatch?: boolean;       // 是否啟用模糊匹配
}

export interface IMemberSearchResult {
  member: IMember;
  matchScore: number;         // 匹配分數 0-100
  matchType: 'exact' | 'fuzzy' | 'partial';
  highlightFields: string[];  // 匹配的欄位
  linkedMembers?: {           // 關聯的其他 BU 會員
    bu: BUCode;
    memberId: string;
    linkType: LinkType;
  }[];
}

// ============================================================================
// 統計報表相關
// ============================================================================

export interface ITransferStatistics {
  period: {
    startDate: string;
    endDate: string;
  };

  // 轉出統計
  transferOut: {
    bu: BUCode;
    totalTransfers: number;
    totalCourses: number;
    totalValue?: number;
  }[];

  // 轉入統計
  transferIn: {
    bu: BUCode;
    totalTransfers: number;
    totalCourses: number;
    totalValue?: number;
  }[];

  // 生成時間
  generatedAt: string;
  generatedBy: string;
}

// ============================================================================
// UI 狀態相關
// ============================================================================

export interface IUIState {
  currentStep: number;
  selectedBU: BUCode | null;
  selectedMember: IMember | null;
  selectedOrder: any; // 使用 any 以兼容 ISimplifiedOrder
  consumptionValues: Record<string, number>;
  shouldTransferOrder: boolean;
  errorMessage: string;
  successMessage: string | null;
}

// ============================================================================
// 配置相關
// ============================================================================

export interface IAppConfig {
  bus: IBU[];
  currentUserBU: BUCode;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  features: {
    enableFuzzyMatch: boolean;
    enableAutoLink: boolean;
    enableStrongLink: boolean;
    enableOrderTransfer: boolean;
  };
}
