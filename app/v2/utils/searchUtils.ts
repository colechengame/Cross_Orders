/**
 * B 版搜尋工具函數
 * 包含模糊匹配、相似度計算等
 */

import type { IMember, IMemberSearchResult, IMemberLink } from "../types";

// ============================================================================
// 字符串相似度計算（使用 Levenshtein Distance）
// ============================================================================

/**
 * 計算兩個字符串的 Levenshtein Distance
 * 用於評估字符串相似度
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // 初始化矩陣
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 填充矩陣
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 刪除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替換
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 計算字符串相似度（0-100）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity);
}

// ============================================================================
// 手機號碼匹配
// ============================================================================

/**
 * 格式化手機號碼（移除分隔符）
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[-\s]/g, "");
}

/**
 * 檢查手機號碼是否匹配
 */
export function isPhoneMatch(phone1: string, phone2: string): boolean {
  const p1 = normalizePhone(phone1);
  const p2 = normalizePhone(phone2);
  return p1 === p2;
}

/**
 * 檢查手機後 N 碼是否匹配
 */
export function isPhoneLastDigitsMatch(
  phone1: string,
  phone2: string,
  digits: number = 4
): boolean {
  const p1 = normalizePhone(phone1);
  const p2 = normalizePhone(phone2);
  const last1 = p1.slice(-digits);
  const last2 = p2.slice(-digits);
  return last1 === last2 && last1.length === digits;
}

// ============================================================================
// 會員搜尋
// ============================================================================

export interface ISearchOptions {
  keyword: string; // 搜尋關鍵字（姓名或手機）
  fuzzyMatch?: boolean; // 是否啟用模糊匹配
  minSimilarity?: number; // 最低相似度（0-100）
  memberLinks?: IMemberLink[]; // 會員關聯數據
}

/**
 * 搜尋會員
 */
export function searchMembers(
  members: IMember[],
  options: ISearchOptions
): IMemberSearchResult[] {
  const {
    keyword,
    fuzzyMatch = true,
    minSimilarity = 60,
    memberLinks = [],
  } = options;

  if (!keyword.trim()) return [];

  const results: IMemberSearchResult[] = [];

  for (const member of members) {
    const matchResult = matchMember(member, keyword, fuzzyMatch, minSimilarity);

    if (matchResult.matched) {
      // 查找關聯的其他 BU 會員
      const linkedMembers = findLinkedMembersForSearch(
        member.name,
        member.phone,
        memberLinks
      );

      results.push({
        member,
        matchScore: matchResult.score,
        matchType: matchResult.type,
        highlightFields: matchResult.highlightFields,
        linkedMembers,
      });
    }
  }

  // 按匹配分數排序（高到低）
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}

/**
 * 匹配單個會員
 */
function matchMember(
  member: IMember,
  keyword: string,
  fuzzyMatch: boolean,
  minSimilarity: number
): {
  matched: boolean;
  score: number;
  type: "exact" | "fuzzy" | "partial";
  highlightFields: string[];
} {
  const kw = keyword.toLowerCase().trim();
  const highlightFields: string[] = [];

  // 1. 精確匹配（完全相同）
  if (member.name.toLowerCase() === kw) {
    return {
      matched: true,
      score: 100,
      type: "exact",
      highlightFields: ["name"],
    };
  }

  if (normalizePhone(member.phone) === normalizePhone(kw)) {
    return {
      matched: true,
      score: 100,
      type: "exact",
      highlightFields: ["phone"],
    };
  }

  // 2. 部分匹配（包含關鍵字）
  if (member.name.toLowerCase().includes(kw)) {
    highlightFields.push("name");
    return {
      matched: true,
      score: 90,
      type: "partial",
      highlightFields,
    };
  }

  if (member.phone.includes(kw)) {
    highlightFields.push("phone");
    return {
      matched: true,
      score: 90,
      type: "partial",
      highlightFields,
    };
  }

  // 3. 手機後 4 碼匹配
  if (
    kw.length === 4 &&
    /^\d{4}$/.test(kw) &&
    normalizePhone(member.phone).endsWith(kw)
  ) {
    highlightFields.push("phone");
    return {
      matched: true,
      score: 85,
      type: "partial",
      highlightFields,
    };
  }

  // 4. 模糊匹配（如果啟用）
  if (fuzzyMatch) {
    const nameSimilarity = calculateSimilarity(member.name, kw);
    const phoneSimilarity = calculateSimilarity(
      normalizePhone(member.phone),
      normalizePhone(kw)
    );

    const maxSimilarity = Math.max(nameSimilarity, phoneSimilarity);

    if (maxSimilarity >= minSimilarity) {
      if (nameSimilarity >= minSimilarity) highlightFields.push("name");
      if (phoneSimilarity >= minSimilarity) highlightFields.push("phone");

      return {
        matched: true,
        score: maxSimilarity,
        type: "fuzzy",
        highlightFields,
      };
    }
  }

  // 未匹配
  return {
    matched: false,
    score: 0,
    type: "exact",
    highlightFields: [],
  };
}

/**
 * 查找關聯的會員（用於搜尋結果）
 */
function findLinkedMembersForSearch(
  name: string,
  phone: string,
  memberLinks: IMemberLink[]
): IMemberSearchResult["linkedMembers"] {
  const link = memberLinks.find((l) =>
    l.members.some((m) => m.memberName === name && m.phone === phone)
  );

  if (!link) return undefined;

  return link.members.map((m) => ({
    bu: m.bu,
    memberId: m.memberId,
    linkType: link.linkType,
  }));
}

// ============================================================================
// 高亮顯示輔助函數
// ============================================================================

/**
 * 高亮顯示匹配的文字
 */
export function highlightText(
  text: string,
  keyword: string
): { parts: { text: string; highlight: boolean }[] } {
  if (!keyword.trim()) {
    return { parts: [{ text, highlight: false }] };
  }

  const kw = keyword.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(kw);

  if (index === -1) {
    return { parts: [{ text, highlight: false }] };
  }

  const parts = [
    { text: text.substring(0, index), highlight: false },
    { text: text.substring(index, index + keyword.length), highlight: true },
    { text: text.substring(index + keyword.length), highlight: false },
  ].filter((part) => part.text.length > 0);

  return { parts };
}

// ============================================================================
// 匹配類型描述
// ============================================================================

/**
 * 獲取匹配類型的描述
 */
export function getMatchTypeDescription(
  matchType: "exact" | "fuzzy" | "partial"
): string {
  switch (matchType) {
    case "exact":
      return "精確匹配";
    case "fuzzy":
      return "模糊匹配";
    case "partial":
      return "部分匹配";
    default:
      return "未知";
  }
}

/**
 * 獲取匹配類型的顏色
 */
export function getMatchTypeColor(
  matchType: "exact" | "fuzzy" | "partial"
): string {
  switch (matchType) {
    case "exact":
      return "text-green-600 dark:text-green-400";
    case "fuzzy":
      return "text-blue-600 dark:text-blue-400";
    case "partial":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-stone-600 dark:text-stone-400";
  }
}
