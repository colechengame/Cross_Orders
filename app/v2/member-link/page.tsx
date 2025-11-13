"use client";

import { useState, useMemo } from "react";
import { mockMembers, mockMemberLinks } from "../utils/mockData";
import type { IMember, IMemberLink } from "../types";
import {
  findAutoLinkCandidates,
  createStrongLink,
  unlinkMembers,
  getMemberLinks,
} from "../utils/memberLinkUtils";

export default function MemberLinkPage() {
  const [members] = useState<IMember[]>(mockMembers);
  const [links, setLinks] = useState<IMemberLink[]>(mockMemberLinks);
  const [selectedMember, setSelectedMember] = useState<IMember | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [candidateMember, setCandidateMember] = useState<IMember | null>(null);

  // 取得選中會員的綁定關係
  const memberLinks = useMemo(() => {
    if (!selectedMember) return [];
    return getMemberLinks(selectedMember.id, links);
  }, [selectedMember, links]);

  // 尋找可自動關聯的候選會員
  const autoCandidates = useMemo(() => {
    if (!selectedMember) return [];
    return findAutoLinkCandidates(selectedMember, members);
  }, [selectedMember, members]);

  // 處理強制綁定
  const handleStrongLink = (targetMember: IMember) => {
    if (!selectedMember) return;

    const newLink = createStrongLink(
      selectedMember,
      targetMember,
      "系統管理員",
      "BU1",
      {
        syncEnabled: true,
        syncDirection: "bidirectional",
        syncFields: ["name", "phone", "email", "birthday", "gender", "address"],
      }
    );

    setLinks([...links, newLink]);
    setShowLinkDialog(false);
    setCandidateMember(null);
  };

  // 處理解除綁定
  const handleUnlink = (linkId: string) => {
    if (!confirm("確定要解除綁定嗎？")) return;
    const updatedLinks = unlinkMembers(linkId, links);
    setLinks(updatedLinks);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                會員綁定管理
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                管理跨 BU 會員的自動關聯和強制綁定 (電話+姓名 或 電話+生日)
              </p>
            </div>
            <a
              href="/v2"
              className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              返回主頁
            </a>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：會員列表 */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">
            會員列表
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedMember?.id === member.id
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-900 dark:text-stone-50">
                        {member.name}
                      </p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        member.bu === 'BU1' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      }`}>
                        {member.bu}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {member.phone} • {member.mainStore}
                    </p>
                  </div>
                  {getMemberLinks(member.id, links).length > 0 && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                      已綁定 {getMemberLinks(member.id, links).length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 右側：綁定詳情 */}
        <div className="space-y-6">
          {selectedMember ? (
            <>
              {/* 會員資訊 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">
                  會員資訊
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      歸屬 BU
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      selectedMember.bu === 'BU1' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {selectedMember.bu}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      姓名
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {selectedMember.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      電話
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {selectedMember.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      生日
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {selectedMember.birthday || "未設定"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      主建檔門市
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {selectedMember.mainStore}
                    </span>
                  </div>
                </div>
              </div>

              {/* 已綁定的會員 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                    已綁定會員
                  </h2>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    共 {memberLinks.length} 筆
                  </span>
                </div>

                {memberLinks.length === 0 ? (
                  <p className="text-center text-stone-500 dark:text-stone-400 py-8">
                    尚無綁定關係
                  </p>
                ) : (
                  <div className="space-y-3">
                    {memberLinks.map((link) => {
                      const linkedMember = link.members.find(
                        (m) => m.memberId !== selectedMember.id
                      );
                      if (!linkedMember) return null;

                      return (
                        <div
                          key={link.linkId}
                          className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-stone-900 dark:text-stone-50">
                                {linkedMember.memberName}
                              </p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                {linkedMember.phone} • {linkedMember.bu}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  link.linkType === "strong"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {link.linkType === "strong"
                                  ? "強制綁定"
                                  : "自動關聯"}
                              </span>
                              {link.syncEnabled && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                  同步啟用
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex gap-2">
                                {link.matchCriteria.nameMatch && (
                                  <span className="text-green-600 dark:text-green-400">
                                    ✓ 姓名
                                  </span>
                                )}
                                {link.matchCriteria.phoneMatch && (
                                  <span className="text-green-600 dark:text-green-400">
                                    ✓ 電話
                                  </span>
                                )}
                                <span className="text-stone-500">
                                  分數: {link.matchCriteria.matchScore}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnlink(link.linkId)}
                                className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                解除綁定
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 可自動關聯的候選會員 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-700">
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                  可關聯會員
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                  規則: 電話相同 + (姓名相同 或 生日相同)
                </p>

                {autoCandidates.length === 0 ? (
                  <p className="text-center text-stone-500 dark:text-stone-400 py-8">
                    未找到符合關聯規則的候選會員
                  </p>
                ) : (
                  <div className="space-y-3">
                    {autoCandidates.map(({ member, matchScore, matchCriteria }) => (
                      <div
                        key={member.id}
                        className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-stone-900 dark:text-stone-50">
                                {member.name}
                              </p>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                member.bu === 'BU1' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {member.bu}
                              </span>
                            </div>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                              {member.phone} • {member.mainStore}
                            </p>
                            <div className="flex gap-2 mt-2 text-xs">
                              {matchCriteria.nameMatch && (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ 姓名匹配
                                </span>
                              )}
                              {matchCriteria.phoneMatch && (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ 電話匹配
                                </span>
                              )}
                              {matchCriteria.birthdayMatch && (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ 生日匹配
                                </span>
                              )}
                              <span className="text-stone-500">
                                (分數: {matchScore})
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCandidateMember(member);
                              setShowLinkDialog(true);
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                          >
                            強制綁定
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
              <svg
                className="mx-auto h-16 w-16 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                請選擇會員
              </h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                從左側列表選擇會員以查看綁定詳情
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 綁定確認對話框 */}
      {showLinkDialog && candidateMember && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">
              確認強制綁定
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-stone-100 dark:bg-stone-700 rounded-lg">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  會員 A
                </p>
                <p className="text-stone-900 dark:text-stone-50">
                  {selectedMember.name}
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {selectedMember.phone} • {selectedMember.mainStore}
                </p>
              </div>

              <div className="text-center text-stone-500">
                <svg
                  className="mx-auto h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </div>

              <div className="p-4 bg-stone-100 dark:bg-stone-700 rounded-lg">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  會員 B
                </p>
                <p className="text-stone-900 dark:text-stone-50">
                  {candidateMember.name}
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {candidateMember.phone} • {candidateMember.mainStore}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>綁定後:</strong>
                  <br />• 資料將雙向同步
                  <br />• 任一會員的資料更新會同步到另一會員
                  <br />• 可隨時解除綁定
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setCandidateMember(null);
                }}
                className="flex-1 px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleStrongLink(candidateMember)}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                確認綁定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
