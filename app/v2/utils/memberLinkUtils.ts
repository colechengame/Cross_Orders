/**
 * 會員綁定工具函數
 * 實作 3碰2 自動關聯和強制綁定功能
 */

import type { IMember, IMemberLink, BUCode } from "../types";

// ============================================================================
// 3碰2 自動關聯邏輯
// ============================================================================

/**
 * 計算兩個會員的匹配分數
 * 規則: (電話 + 姓名) 或 (電話 + 生日) 匹配
 */
export function calculateMatchScore(member1: IMember, member2: IMember): {
  score: number;
  nameMatch: boolean;
  phoneMatch: boolean;
  birthdayMatch: boolean;
  canAutoLink: boolean;
} {
  const nameMatch = member1.name === member2.name;
  const phoneMatch = member1.phone === member2.phone;
  const birthdayMatch = member1.birthday === member2.birthday;

  // 新規則: 必須電話匹配 + (姓名或生日)匹配
  const canAutoLink = phoneMatch && (nameMatch || birthdayMatch);

  // 計算分數 (0-100)
  let score = 0;
  if (phoneMatch) score += 50; // 電話是必要條件,佔 50 分
  if (nameMatch) score += 30;
  if (birthdayMatch) score += 20;

  return {
    score,
    nameMatch,
    phoneMatch,
    birthdayMatch,
    canAutoLink,
  };
}

/**
 * 在所有會員中尋找可以自動關聯的會員
 */
export function findAutoLinkCandidates(
  targetMember: IMember,
  allMembers: IMember[],
  excludeBU?: BUCode
): Array<{
  member: IMember;
  matchScore: number;
  matchCriteria: {
    nameMatch: boolean;
    phoneMatch: boolean;
    birthdayMatch: boolean;
  };
}> {
  const candidates: Array<{
    member: IMember;
    matchScore: number;
    matchCriteria: {
      nameMatch: boolean;
      phoneMatch: boolean;
      birthdayMatch: boolean;
    };
  }> = [];

  for (const member of allMembers) {
    // 跳過同一個會員
    if (member.id === targetMember.id) continue;

    // 跳過指定要排除的 BU
    if (excludeBU && member.mainStore === getMemberBU(member)) continue;

    const match = calculateMatchScore(targetMember, member);

    // 只保留符合 3碰2 規則的
    if (match.canAutoLink) {
      candidates.push({
        member,
        matchScore: match.score,
        matchCriteria: {
          nameMatch: match.nameMatch,
          phoneMatch: match.phoneMatch,
          birthdayMatch: match.birthdayMatch,
        },
      });
    }
  }

  // 依分數排序
  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 根據會員的 mainStore 推斷 BU 代碼
 */
function getMemberBU(member: IMember): BUCode {
  if (member.mainStore === "板橋醫美") return "BU1";
  if (member.mainStore === "愛美肌" || member.mainStore === "漾澤") return "BU3";
  return "BU3"; // 默認值
}

// ============================================================================
// 自動關聯建立
// ============================================================================

/**
 * 為兩個會員建立自動關聯
 */
export function createAutoLink(
  member1: IMember,
  member2: IMember
): IMemberLink | null {
  const match = calculateMatchScore(member1, member2);

  if (!match.canAutoLink) {
    return null;
  }

  const bu1 = getMemberBU(member1);
  const bu2 = getMemberBU(member2);

  return {
    linkId: `LINK-AUTO-${Date.now()}`,
    linkType: "auto",
    linkStatus: "linked",
    linkDate: new Date().toISOString(),
    members: [
      {
        bu: bu1,
        memberId: member1.id,
        memberName: member1.name,
        phone: member1.phone,
      },
      {
        bu: bu2,
        memberId: member2.id,
        memberName: member2.name,
        phone: member2.phone,
      },
    ],
    matchCriteria: {
      nameMatch: match.nameMatch,
      phoneMatch: match.phoneMatch,
      matchScore: match.score,
    },
    syncEnabled: false, // 自動關聯預設不啟用同步
  };
}

// ============================================================================
// 強制綁定
// ============================================================================

/**
 * 強制綁定兩個會員（不需要符合 3碰2 規則）
 */
export function createStrongLink(
  member1: IMember,
  member2: IMember,
  operator: string,
  operatorBU: BUCode,
  syncConfig?: {
    syncEnabled: boolean;
    syncDirection?: "bidirectional" | "one-way";
    masterDataSource?: BUCode;
    syncFields?: string[];
  }
): IMemberLink {
  const match = calculateMatchScore(member1, member2);
  const bu1 = getMemberBU(member1);
  const bu2 = getMemberBU(member2);

  return {
    linkId: `LINK-STRONG-${Date.now()}`,
    linkType: "strong",
    linkStatus: "strong-linked",
    linkDate: new Date().toISOString(),
    strongLinkDate: new Date().toISOString(),
    members: [
      {
        bu: bu1,
        memberId: member1.id,
        memberName: member1.name,
        phone: member1.phone,
      },
      {
        bu: bu2,
        memberId: member2.id,
        memberName: member2.name,
        phone: member2.phone,
      },
    ],
    matchCriteria: {
      nameMatch: match.nameMatch,
      phoneMatch: match.phoneMatch,
      matchScore: match.score,
    },
    operator,
    operatorBU,
    syncEnabled: syncConfig?.syncEnabled ?? true, // 強制綁定預設啟用同步
    syncDirection: syncConfig?.syncDirection ?? "bidirectional",
    masterDataSource: syncConfig?.masterDataSource,
    syncFields: syncConfig?.syncFields ?? [
      "name",
      "phone",
      "email",
      "birthday",
      "gender",
      "address",
    ],
  };
}

// ============================================================================
// 資料同步
// ============================================================================

/**
 * 同步會員資料
 * 根據綁定設定同步會員資料到其他已綁定的會員
 */
export function syncMemberData(
  updatedMember: IMember,
  link: IMemberLink,
  allMembers: IMember[]
): IMember[] {
  if (!link.syncEnabled) {
    return allMembers;
  }

  const updatedMembers = [...allMembers];
  const updatedMemberBU = getMemberBU(updatedMember);

  // 找出需要同步的會員
  const targetMembers = link.members.filter(
    (m) => m.memberId !== updatedMember.id
  );

  for (const targetMemberInfo of targetMembers) {
    const targetMemberIndex = updatedMembers.findIndex(
      (m) => m.id === targetMemberInfo.memberId
    );

    if (targetMemberIndex === -1) continue;

    const targetMember = updatedMembers[targetMemberIndex];

    // 檢查同步方向
    if (link.syncDirection === "one-way") {
      // 單向同步: 只有主資料源可以同步到其他會員
      if (link.masterDataSource && updatedMemberBU !== link.masterDataSource) {
        continue;
      }
    }

    // 同步指定欄位
    const syncedMember = { ...targetMember };
    const fieldsToSync = link.syncFields || [];

    for (const field of fieldsToSync) {
      if (field in updatedMember) {
        (syncedMember as any)[field] = (updatedMember as any)[field];
      }
    }

    // 更新時間戳
    syncedMember.updatedAt = new Date().toISOString();
    syncedMember.updatedBy = `同步自 ${updatedMember.mainStore}`;

    updatedMembers[targetMemberIndex] = syncedMember;
  }

  return updatedMembers;
}

/**
 * 解除綁定
 */
export function unlinkMembers(
  linkId: string,
  allLinks: IMemberLink[]
): IMemberLink[] {
  return allLinks.map((link) =>
    link.linkId === linkId
      ? {
          ...link,
          linkStatus: "unlinked" as const,
          syncEnabled: false,
        }
      : link
  );
}

/**
 * 取得會員的所有綁定關係
 */
export function getMemberLinks(
  memberId: string,
  allLinks: IMemberLink[]
): IMemberLink[] {
  return allLinks.filter((link) =>
    link.members.some((m) => m.memberId === memberId)
  );
}

/**
 * 檢查兩個會員是否已經綁定
 */
export function areMembersLinked(
  member1Id: string,
  member2Id: string,
  allLinks: IMemberLink[]
): IMemberLink | null {
  return (
    allLinks.find(
      (link) =>
        link.linkStatus !== "unlinked" &&
        link.members.some((m) => m.memberId === member1Id) &&
        link.members.some((m) => m.memberId === member2Id)
    ) || null
  );
}
