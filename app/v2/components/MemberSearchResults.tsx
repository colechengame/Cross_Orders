/**
 * 會員搜尋結果顯示組件
 * 顯示搜尋結果，包括匹配分數、關聯會員等資訊
 */

import type { IMemberSearchResult } from "../types";
import {
  getMatchTypeDescription,
  getMatchTypeColor,
  highlightText,
} from "../utils/searchUtils";

interface MemberSearchResultsProps {
  results: IMemberSearchResult[];
  keyword: string;
  onSelectMember: (result: IMemberSearchResult) => void;
  className?: string;
}

export default function MemberSearchResults({
  results,
  keyword,
  onSelectMember,
  className = "",
}: MemberSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 border border-stone-200 dark:border-stone-700 ${className}`}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-stone-900 dark:text-stone-100">
            未找到符合的會員
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            請嘗試其他搜尋關鍵字或切換搜尋門市
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          搜尋結果 ({results.length})
        </h3>
        {results.length > 0 && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            點擊會員卡片以選擇
          </p>
        )}
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <MemberCard
            key={`${result.member.id}-${index}`}
            result={result}
            keyword={keyword}
            onClick={() => onSelectMember(result)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 會員卡片組件
// ============================================================================

interface MemberCardProps {
  result: IMemberSearchResult;
  keyword: string;
  onClick: () => void;
}

function MemberCard({ result, keyword, onClick }: MemberCardProps) {
  const { member, matchScore, matchType, highlightFields, linkedMembers } =
    result;

  const nameHighlight = highlightText(member.name, keyword);
  const phoneHighlight = highlightText(member.phone, keyword);

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-stone-800 rounded-xl shadow-md hover:shadow-xl
                 border border-stone-200 dark:border-stone-700 p-5
                 transition-all duration-200 hover:scale-[1.02] hover:border-amber-400 dark:hover:border-amber-500
                 text-left group"
    >
      {/* 頭部：匹配分數和類型 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 匹配分數 */}
          <div className="flex items-center gap-1.5">
            <div
              className={`
              flex items-center justify-center w-12 h-12 rounded-lg font-bold text-white text-sm
              ${matchScore >= 90 ? "bg-green-500" : matchScore >= 70 ? "bg-blue-500" : "bg-amber-500"}
            `}
            >
              {matchScore}
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                匹配度
              </p>
              <p
                className={`text-xs font-medium ${getMatchTypeColor(
                  matchType
                )}`}
              >
                {getMatchTypeDescription(matchType)}
              </p>
            </div>
          </div>
        </div>

        {/* 選擇提示 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-6 h-6 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* 會員資訊 */}
      <div className="space-y-2">
        {/* 姓名 */}
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 ${
              highlightFields.includes("name")
                ? "text-amber-500"
                : "text-stone-400"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {nameHighlight.parts.map((part, i) => (
              <span
                key={i}
                className={
                  part.highlight
                    ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                    : ""
                }
              >
                {part.text}
              </span>
            ))}
          </span>
        </div>

        {/* 手機 */}
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 ${
              highlightFields.includes("phone")
                ? "text-amber-500"
                : "text-stone-400"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {phoneHighlight.parts.map((part, i) => (
              <span
                key={i}
                className={
                  part.highlight
                    ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-medium"
                    : ""
                }
              >
                {part.text}
              </span>
            ))}
          </span>
        </div>

        {/* 門市 */}
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-stone-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {member.mainStore}
          </span>
        </div>
      </div>

      {/* 關聯會員提示 */}
      {linkedMembers && linkedMembers.length > 1 && (
        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              已關聯 {linkedMembers.length - 1} 個其他門市會員
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
