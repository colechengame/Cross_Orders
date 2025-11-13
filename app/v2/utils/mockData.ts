/**
 * B 版模擬數據
 * 用於開發和測試
 */

import type { IBU, IMember, IOrder, IMemberLink } from "../types";

// ============================================================================
// BU 配置
// ============================================================================

export const mockBUs: IBU[] = [
  {
    code: "BU1",
    name: "板橋醫美",
    displayName: "🏪 板橋醫美 (BU1)",
  },
  {
    code: "BU3",
    name: "漾澤",
    displayName: "🏪 漾澤 (BU3)",
  },
  {
    code: "BU3",
    name: "愛美肌",
    displayName: "🏪 愛美肌 (BU3)",
  },
];

// ============================================================================
// 會員數據
// ============================================================================

export const mockMembers: IMember[] = [
  // BU3 會員
  {
    id: "M-BU3-001",
    name: "王小美",
    phone: "0912-345-678",
    email: "wang@example.com",
    birthday: "1990-05-15",
    gender: "female",
    mainStore: "愛美肌",
    relatedStores: ["板橋醫美"],
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "張諮詢師",
    createdStore: "愛美肌",
  },
  {
    id: "M-BU3-002",
    name: "李大華",
    phone: "0923-456-789",
    email: "lee@example.com",
    birthday: "1985-08-20",
    gender: "male",
    mainStore: "愛美肌",
    relatedStores: [],
    createdAt: "2024-02-10T14:30:00Z",
    createdBy: "陳諮詢師",
    createdStore: "愛美肌",
  },
  {
    id: "M-BU3-003",
    name: "陳小明",
    phone: "0934-567-890",
    email: "chen@example.com",
    birthday: "1992-03-10",
    gender: "male",
    mainStore: "愛美肌",
    relatedStores: ["漾澤"],
    createdAt: "2024-03-05T09:15:00Z",
    createdBy: "林諮詢師",
    createdStore: "愛美肌",
  },

  // BU1 會員
  {
    id: "M-BU1-001",
    name: "王小美",
    phone: "0912-345-678",
    email: "wang@example.com",
    birthday: "1990-05-15",
    gender: "female",
    mainStore: "板橋醫美",
    relatedStores: ["愛美肌"],
    createdAt: "2024-01-20T11:00:00Z",
    createdBy: "張店長",
    createdStore: "板橋醫美",
  },
  {
    id: "M-BU1-002",
    name: "劉美麗",
    phone: "0945-678-901",
    email: "liu@example.com",
    birthday: "1988-11-25",
    gender: "female",
    mainStore: "板橋醫美",
    relatedStores: [],
    createdAt: "2024-02-15T13:45:00Z",
    createdBy: "王諮詢師",
    createdStore: "板橋醫美",
  },

  // BU2 會員
  {
    id: "M-BU2-001",
    name: "陳小明",
    phone: "0934-567-890",
    email: "chen@example.com",
    birthday: "1992-03-10",
    gender: "male",
    mainStore: "漾澤",
    relatedStores: ["愛美肌"],
    createdAt: "2024-03-08T10:30:00Z",
    createdBy: "趙諮詢師",
    createdStore: "漾澤",
  },
  {
    id: "M-BU2-002",
    name: "黃美玲",
    phone: "0956-789-012",
    email: "huang@example.com",
    birthday: "1995-07-18",
    gender: "female",
    mainStore: "漾澤",
    relatedStores: [],
    createdAt: "2024-04-12T15:20:00Z",
    createdBy: "趙諮詢師",
    createdStore: "漾澤",
  },

  // 更多 BU3 會員
  {
    id: "M-BU3-004",
    name: "林雅婷",
    phone: "0967-890-123",
    email: "lin@example.com",
    birthday: "1987-09-22",
    gender: "female",
    mainStore: "愛美肌",
    relatedStores: [],
    createdAt: "2024-05-08T11:30:00Z",
    createdBy: "張諮詢師",
    createdStore: "愛美肌",
  },
  {
    id: "M-BU3-005",
    name: "張志明",
    phone: "0978-901-234",
    email: "chang@example.com",
    birthday: "1983-12-05",
    gender: "male",
    mainStore: "愛美肌",
    relatedStores: [],
    createdAt: "2024-06-15T14:45:00Z",
    createdBy: "陳諮詢師",
    createdStore: "愛美肌",
  },
  {
    id: "M-BU3-006",
    name: "吳佳穎",
    phone: "0989-012-345",
    email: "wu@example.com",
    birthday: "1993-04-30",
    gender: "female",
    mainStore: "愛美肌",
    relatedStores: [],
    createdAt: "2024-07-20T09:15:00Z",
    createdBy: "林諮詢師",
    createdStore: "愛美肌",
  },

  // 更多 BU1 會員
  {
    id: "M-BU1-003",
    name: "周文傑",
    phone: "0912-123-456",
    email: "chou@example.com",
    birthday: "1991-06-14",
    gender: "male",
    mainStore: "板橋醫美",
    relatedStores: [],
    createdAt: "2024-08-10T10:00:00Z",
    createdBy: "張店長",
    createdStore: "板橋醫美",
  },
  {
    id: "M-BU1-004",
    name: "鄭美惠",
    phone: "0923-234-567",
    email: "cheng@example.com",
    birthday: "1989-11-08",
    gender: "female",
    mainStore: "板橋醫美",
    relatedStores: [],
    createdAt: "2024-09-05T13:30:00Z",
    createdBy: "王諮詢師",
    createdStore: "板橋醫美",
  },
  {
    id: "M-BU1-005",
    name: "許雅芳",
    phone: "0934-345-678",
    email: "hsu@example.com",
    birthday: "1994-02-19",
    gender: "female",
    mainStore: "板橋醫美",
    relatedStores: [],
    createdAt: "2024-10-12T16:45:00Z",
    createdBy: "張店長",
    createdStore: "板橋醫美",
  },
];

// ============================================================================
// 會員關聯數據
// ============================================================================

export const mockMemberLinks: IMemberLink[] = [
  // 王小美：BU3 和 BU1 已自動關聯
  {
    linkId: "LINK-001",
    linkType: "auto",
    linkStatus: "linked",
    linkDate: "2024-01-20T11:00:00Z",
    members: [
      {
        bu: "BU3",
        memberId: "M-BU3-001",
        memberName: "王小美",
        phone: "0912-345-678",
      },
      {
        bu: "BU1",
        memberId: "M-BU1-001",
        memberName: "王小美",
        phone: "0912-345-678",
      },
    ],
    matchCriteria: {
      nameMatch: true,
      phoneMatch: true,
      matchScore: 100,
    },
    syncEnabled: false,
  },
  // 陳小明：BU3 和 BU3 已自動關聯 (愛美肌和漾澤)
  {
    linkId: "LINK-002",
    linkType: "auto",
    linkStatus: "linked",
    linkDate: "2024-03-08T10:30:00Z",
    members: [
      {
        bu: "BU3",
        memberId: "M-BU3-003",
        memberName: "陳小明",
        phone: "0934-567-890",
      },
      {
        bu: "BU3",
        memberId: "M-BU2-001",
        memberName: "陳小明",
        phone: "0934-567-890",
      },
    ],
    matchCriteria: {
      nameMatch: true,
      phoneMatch: true,
      matchScore: 100,
    },
    syncEnabled: false,
  },
];

// ============================================================================
// 訂單數據（扁平化結構，每個課程作為獨立訂單）
// ============================================================================

// 課程模板
const courseTemplates = [
  { name: "肌膚緊緻課程", category: "臉部保養", unitPrice: 2000, unit: "堂" },
  { name: "深層保濕課程", category: "臉部保養", unitPrice: 1500, unit: "堂" },
  { name: "美白淡斑課程", category: "臉部保養", unitPrice: 2500, unit: "堂" },
  { name: "抗老拉提課程", category: "臉部保養", unitPrice: 3000, unit: "堂" },
  { name: "淡化細紋課程", category: "臉部保養", unitPrice: 2800, unit: "堂" },
  { name: "毛孔緊緻課程", category: "臉部保養", unitPrice: 1800, unit: "堂" },
  { name: "身體雕塑課程", category: "身體保養", unitPrice: 3500, unit: "堂" },
  { name: "纖體瘦身課程", category: "身體保養", unitPrice: 4000, unit: "堂" },
  { name: "淋巴排毒課程", category: "身體保養", unitPrice: 2200, unit: "堂" },
  { name: "肩頸舒壓課程", category: "身體保養", unitPrice: 1500, unit: "堂" },
  { name: "除毛護理課程", category: "身體保養", unitPrice: 1000, unit: "次" },
  { name: "足部保養課程", category: "身體保養", unitPrice: 800, unit: "次" },
  { name: "精油按摩課程", category: "紓壓放鬆", unitPrice: 2000, unit: "堂" },
  { name: "熱石療法課程", category: "紓壓放鬆", unitPrice: 2500, unit: "堂" },
  { name: "芳香療法課程", category: "紓壓放鬆", unitPrice: 1800, unit: "堂" },
  { name: "專屬VIP課程", category: "特殊療程", unitPrice: 5000, unit: "堂" },
  { name: "醫美雷射課程", category: "特殊療程", unitPrice: 8000, unit: "次" },
  { name: "音波拉提課程", category: "特殊療程", unitPrice: 12000, unit: "次" },
];

// 生成訂單的輔助函數
function generateCourseOrders(
  memberId: string,
  memberName: string,
  phone: string,
  bu: "BU1" | "BU2" | "BU3",
  store: string,
  courseCount: number
): IOrder[] {
  const orders: IOrder[] = [];
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // 隨機選擇課程
  const selectedCourses = courseTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, courseCount);

  selectedCourses.forEach((course, index) => {
    const totalQuantity = Math.floor(Math.random() * 20) + 5; // 5-24 堂
    const usedQuantity = Math.floor(Math.random() * Math.min(totalQuantity / 2, 5)); // 0-5 堂已使用
    const remainingQuantity = totalQuantity - usedQuantity;

    // 80% 的課程是共享課程
    const isShared = Math.random() > 0.2;

    const purchaseDate = new Date(today);
    purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 60)); // 過去 60 天內購買

    orders.push({
      id: `ORD-${bu}-${memberId}-${index + 1}`,
      orderNumber: `SO-2024${String(11 + Math.floor(Math.random() * 2)).padStart(
        2,
        "0"
      )}${String(Math.floor(Math.random() * 30) + 1).padStart(2, "0")}-${String(
        Math.floor(Math.random() * 999) + 1
      ).padStart(3, "0")}`,
      memberName,
      phone,
      memberId,
      store,
      originalStore: store,
      status: "active",
      items: [
        {
          itemId: `ITEM-${bu}-${memberId}-${index + 1}`,
          name: course.name,
          productCode: `PRD-${String(index + 1).padStart(3, "0")}`,
          category: course.category,
          total: totalQuantity,
          used: usedQuantity,
          remaining: remainingQuantity,
          unitPrice: course.unitPrice,
          shared: isShared,
          validFrom: purchaseDate.toISOString().split("T")[0],
          validUntil: oneYearLater.toISOString().split("T")[0],
        },
      ],
      totalAmount: course.unitPrice * totalQuantity,
      paidAmount: course.unitPrice * totalQuantity,
      remainingAmount: 0,
      orderDate: purchaseDate.toISOString().split("T")[0],
      createdAt: purchaseDate.toISOString(),
      consultant: ["張諮詢師", "陳諮詢師", "林諮詢師", "王諮詢師"][
        Math.floor(Math.random() * 4)
      ],
      salesperson: ["張店長", "陳店長", "林店長", "王店長"][
        Math.floor(Math.random() * 4)
      ],
      isTransferred: false,
    });
  });

  return orders;
}

// 為每個會員生成訂單
export const mockOrders: IOrder[] = [
  // BU3 會員訂單 (愛美肌)
  ...generateCourseOrders(
    "M-BU3-001",
    "王小美",
    "0912-345-678",
    "BU3",
    "愛美肌",
    10
  ),
  ...generateCourseOrders(
    "M-BU3-002",
    "李大華",
    "0923-456-789",
    "BU3",
    "愛美肌",
    8
  ),
  ...generateCourseOrders(
    "M-BU3-003",
    "陳小明",
    "0934-567-890",
    "BU3",
    "愛美肌",
    9
  ),
  ...generateCourseOrders(
    "M-BU3-004",
    "林雅婷",
    "0967-890-123",
    "BU3",
    "愛美肌",
    12
  ),
  ...generateCourseOrders(
    "M-BU3-005",
    "張志明",
    "0978-901-234",
    "BU3",
    "愛美肌",
    7
  ),
  ...generateCourseOrders(
    "M-BU3-006",
    "吳佳穎",
    "0989-012-345",
    "BU3",
    "愛美肌",
    11
  ),

  // BU1 會員訂單 (板橋醫美)
  ...generateCourseOrders(
    "M-BU1-001",
    "王小美",
    "0912-345-678",
    "BU1",
    "板橋醫美",
    6
  ),
  ...generateCourseOrders(
    "M-BU1-002",
    "劉美麗",
    "0945-678-901",
    "BU1",
    "板橋醫美",
    13
  ),
  ...generateCourseOrders(
    "M-BU1-003",
    "周文傑",
    "0912-123-456",
    "BU1",
    "板橋醫美",
    8
  ),
  ...generateCourseOrders(
    "M-BU1-004",
    "鄭美惠",
    "0923-234-567",
    "BU1",
    "板橋醫美",
    10
  ),
  ...generateCourseOrders(
    "M-BU1-005",
    "許雅芳",
    "0934-345-678",
    "BU1",
    "板橋醫美",
    9
  ),

  // BU3 會員訂單 (漾澤)
  ...generateCourseOrders(
    "M-BU2-001",
    "陳小明",
    "0934-567-890",
    "BU3",
    "漾澤",
    8
  ),
  ...generateCourseOrders(
    "M-BU2-002",
    "黃美玲",
    "0956-789-012",
    "BU3",
    "漾澤",
    11
  ),
];

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 根據 BU 代碼獲取會員列表
 */
export function getMembersByBU(buCode: string): IMember[] {
  return mockMembers.filter((member) => {
    if (buCode === "BU1") return member.mainStore === "板橋醫美";
    if (buCode === "BU3") return member.mainStore === "愛美肌" || member.mainStore === "漾澤";
    return false;
  });
}

/**
 * 簡化的訂單結構（用於 UI 顯示）
 */
export interface ISimplifiedOrder {
  orderId: string;
  orderNumber: string;
  bu: "BU1" | "BU2" | "BU3";
  courseName: string;
  courseType: "shared" | "exclusive";
  category: string;
  remainingQuantity: number;
  totalQuantity: number;
  quantityUnit: string;
  status: "active" | "completed" | "cancelled";
  validityDate: string;
  purchaseDate: string;
}

/**
 * 將 IOrder 轉換為簡化的訂單結構
 */
function convertToSimplifiedOrder(order: IOrder): ISimplifiedOrder | null {
  // 只取第一個課程項目
  const item = order.items[0];
  if (!item || item.remaining <= 0) return null;

  // 從 store 名稱推斷 BU 代碼
  let bu: "BU1" | "BU2" | "BU3";
  if (order.store === "板橋醫美") bu = "BU1";
  else if (order.store === "愛美肌" || order.store === "漾澤") bu = "BU3";
  else bu = "BU3"; // 默認值

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    bu,
    courseName: item.name,
    courseType: item.shared ? "shared" : "exclusive",
    category: item.category,
    remainingQuantity: item.remaining,
    totalQuantity: item.total,
    quantityUnit: courseTemplates.find((c) => c.name === item.name)?.unit || "堂",
    status: order.status as "active" | "completed" | "cancelled",
    validityDate: item.validUntil || "",
    purchaseDate: order.orderDate,
  };
}

/**
 * 根據會員 ID 獲取訂單列表（簡化版）
 */
export function getOrdersByMemberId(memberId: string): ISimplifiedOrder[] {
  return mockOrders
    .filter((order) => order.memberId === memberId)
    .map((order) => convertToSimplifiedOrder(order))
    .filter((order): order is ISimplifiedOrder => order !== null);
}

/**
 * 根據姓名和手機查找關聯的會員
 */
export function findLinkedMembers(name: string, phone: string): IMemberLink | undefined {
  return mockMemberLinks.find((link) =>
    link.members.some((m) => m.memberName === name && m.phone === phone)
  );
}
