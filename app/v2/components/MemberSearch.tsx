/**
 * 會員搜尋組件
 * 支持姓名、手機號碼搜尋，並可啟用模糊匹配
 */

import { useState } from "react";
import type { BUCode } from "../types";

interface MemberSearchProps {
  selectedBU: BUCode | null;
  onSearch: (keyword: string) => void;
  isSearching?: boolean;
  className?: string;
}

export default function MemberSearch({
  selectedBU,
  onSearch,
  isSearching = false,
  className = "",
}: MemberSearchProps) {
  const [keyword, setKeyword] = useState("");

  const handleSearch = () => {
    if (!selectedBU) {
      alert("請先選擇搜尋門市");
      return;
    }
    if (!keyword.trim()) {
      alert("請輸入搜尋關鍵字");
      return;
    }
    onSearch(keyword.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        會員搜尋：
      </label>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入姓名或手機號碼..."
            disabled={!selectedBU}
            className="w-full pl-12 pr-4 py-3 text-base border border-stone-300 dark:border-stone-600
                       rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                       placeholder-stone-400 dark:placeholder-stone-500
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500
                       shadow-sm hover:shadow-md
                       disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:cursor-not-allowed
                       disabled:opacity-50"
          />

          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={!selectedBU || !keyword.trim() || isSearching}
          className="px-8 py-3 bg-amber-500 text-white rounded-xl font-medium
                     hover:bg-amber-600 active:bg-amber-700
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     transition-all duration-200 shadow-md hover:shadow-lg
                     disabled:bg-stone-300 dark:disabled:bg-stone-700
                     disabled:cursor-not-allowed disabled:opacity-50
                     flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              搜尋中...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              搜尋會員
            </>
          )}
        </button>
      </div>

      {!selectedBU && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          請先選擇搜尋門市
        </p>
      )}

      {selectedBU && keyword.length > 0 && keyword.length < 2 && (
        <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          請至少輸入 2 個字元
        </p>
      )}
    </div>
  );
}
