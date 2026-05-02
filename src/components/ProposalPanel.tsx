import { useEffect, useMemo, useState } from "react";
import { Pencil, Send, Trash2, X } from "lucide-react";
import type { PipelineProposal } from "../types/index";
import {
  getAiTranslation,
  getProposalActionLabel,
  getProposalTargetText,
  proposalNeedsValue,
} from "../utils/pipelineHelpers";

const PROPOSAL_MESSAGE_MAX_LENGTH = 260;
const PROPOSAL_DRAFT_MAX_LENGTH = 90;

type ProposalTab = "chat" | "status";

interface ProposalPanelProps {
  role: "pm" | "dev-fe" | "dev-be";
  pipelineProposals: PipelineProposal[];
  onClose: () => void;
  onAddMessage: (proposalId: string, content: string) => void;
  onUpdateMessage: (proposalId: string, messageId: string, content: string) => void;
  onDeleteMessage: (proposalId: string, messageId: string) => void;
  onUpdateProposalValue: (proposalId: string, proposedValue: string) => void;
  onToggleConfirm: (proposalId: string) => void;
}

export default function ProposalPanel({
  role,
  pipelineProposals,
  onClose,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
  onUpdateProposalValue,
  onToggleConfirm,
}: ProposalPanelProps) {
  const isPm = role === "pm";
  const [activeTab, setActiveTab] = useState<ProposalTab>("chat");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [proposalDraft, setProposalDraft] = useState("");
  const [expandedTranslations, setExpandedTranslations] = useState<Set<string>>(new Set());

  const pendingCount = useMemo(
    () => pipelineProposals.filter((p) => p.status === "pending").length,
    [pipelineProposals],
  );

  const selectedProposal = useMemo(() => {
    if (pipelineProposals.length === 0) return null;
    if (!selectedProposalId) return pipelineProposals[0];
    return pipelineProposals.find((p) => p.id === selectedProposalId) ?? pipelineProposals[0];
  }, [pipelineProposals, selectedProposalId]);

  useEffect(() => {
    if (!selectedProposal) { setSelectedProposalId(null); setProposalDraft(""); return; }
    if (selectedProposalId !== selectedProposal.id) setSelectedProposalId(selectedProposal.id);
  }, [selectedProposal, selectedProposalId]);

  useEffect(() => {
    setProposalDraft(selectedProposal?.proposedValue ?? "");
  }, [selectedProposal?.id, selectedProposal?.proposedValue]);

  const toggleTranslation = (id: string) =>
    setExpandedTranslations((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submitMessage = () => {
    const trimmed = newMessage.trim().slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending" || !trimmed) return;
    onAddMessage(selectedProposal.id, trimmed);
    setNewMessage("");
  };

  const saveEditedMessage = () => {
    const trimmed = editingMessageContent.trim().slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || !editingMessageId || !trimmed) return;
    onUpdateMessage(selectedProposal.id, editingMessageId, trimmed);
    setEditingMessageId(null);
    setEditingMessageContent("");
  };

  const removeMessage = (messageId: string) => {
    if (!selectedProposal) return;
    onDeleteMessage(selectedProposal.id, messageId);
    if (editingMessageId === messageId) { setEditingMessageId(null); setEditingMessageContent(""); }
  };

  const saveDraft = () => {
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    const trimmed = proposalDraft.trim().slice(0, PROPOSAL_DRAFT_MAX_LENGTH);
    if (proposalNeedsValue(selectedProposal.action) && !trimmed) return;
    onUpdateProposalValue(selectedProposal.id, trimmed);
  };

  return (
    <div className="w-[360px] shrink-0 flex flex-col bg-white border-l border-[#E5E5E5] min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
        <p className="text-sm font-semibold text-gray-900">협업 패널</p>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#9E9E9E] hover:bg-[#F5F5F5] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#E5E5E5] px-4 shrink-0">
        {(["chat", "status"] as ProposalTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-gray-900 text-gray-900 font-semibold"
                : "border-transparent text-[#9E9E9E] hover:text-gray-700"
            }`}
          >
            {tab === "chat" ? "제안 채팅" : `제안 현황 ${pendingCount > 0 ? `(${pendingCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <div className="flex-1 grid grid-cols-[140px_1fr] min-h-0 overflow-hidden">
          {/* Proposal list */}
          <div className="border-r border-[#E5E5E5] p-2 space-y-1 overflow-y-auto">
            {pipelineProposals.length === 0 && (
              <p className="text-[11px] text-[#9E9E9E] p-2">제안이 없습니다.</p>
            )}
            {pipelineProposals.map((proposal) => {
              const isSelected = selectedProposal?.id === proposal.id;
              return (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedProposalId(proposal.id)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] space-y-0.5 transition-colors ${
                    isSelected
                      ? "border-gray-900 bg-gray-50"
                      : "border-[#E5E5E5] bg-white hover:bg-[#F5F5F5]"
                  }`}
                >
                  <p className="font-semibold text-gray-800 truncate">
                    {getProposalActionLabel(proposal.action)}
                  </p>
                  <p className="text-[#9E9E9E] break-words leading-snug line-clamp-2">
                    {getProposalTargetText(proposal)}
                  </p>
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      proposal.status === "pending"
                        ? "bg-[#6366F1]/10 text-[#6366F1]"
                        : proposal.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                    }`}
                  >
                    {proposal.status === "pending" ? "진행중" : proposal.status === "approved" ? "반영" : "거절"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chat area */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            {!selectedProposal && (
              <div className="flex-1 flex items-center justify-center text-xs text-[#9E9E9E]">
                제안을 선택하세요.
              </div>
            )}

            {selectedProposal && (
              <>
                {/* Proposal info header */}
                <div className="px-3 py-2 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
                  <p className="text-[11px] font-semibold text-gray-700">
                    {getProposalActionLabel(selectedProposal.action)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#9E9E9E] break-words">
                    {getProposalTargetText(selectedProposal)}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                  {selectedProposal.messages.map((message) => {
                    const isMsgPm = message.role === "pm";
                    const isMine = isPm ? isMsgPm : !isMsgPm;
                    const isEditing = editingMessageId === message.id;
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[90%] rounded-xl px-3 py-2 ${
                            isMine
                              ? "bg-gray-900 text-white"
                              : "bg-[#F5F5F5] border border-[#E5E5E5] text-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[10px] font-semibold ${isMine ? "text-white/60" : "text-[#9E9E9E]"}`}>
                              {isMsgPm ? "PM" : "DEV"} · {message.createdAt}
                            </p>
                            {isMine && selectedProposal.status === "pending" && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setEditingMessageId(message.id); setEditingMessageContent(message.content); }}
                                  className="rounded p-0.5 hover:bg-white/20 transition-colors"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => removeMessage(message.id)}
                                  className="rounded p-0.5 hover:bg-white/20 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-1.5 space-y-1.5">
                              <textarea
                                rows={2}
                                maxLength={PROPOSAL_MESSAGE_MAX_LENGTH}
                                value={editingMessageContent}
                                onChange={(e) => setEditingMessageContent(e.target.value)}
                                className="w-full rounded-md border border-[#E5E5E5] bg-white text-gray-900 px-2 py-1 text-[11px] focus:outline-none"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => { setEditingMessageId(null); setEditingMessageContent(""); }}
                                  className="rounded border border-[#E5E5E5] px-2 py-0.5 text-[10px] text-gray-600"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={saveEditedMessage}
                                  className="rounded bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="mt-1 text-[11px] whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <button
                                onClick={() => toggleTranslation(message.id)}
                                className={`mt-1.5 flex items-center gap-1 text-[10px] ${
                                  isMine ? "text-white/40 hover:text-white/70" : "text-[#C4C4C4] hover:text-[#9E9E9E]"
                                }`}
                              >
                                AI 번역 {expandedTranslations.has(message.id) ? "▲" : "▼"}
                              </button>
                              {expandedTranslations.has(message.id) && (
                                <div
                                  className={`mt-1.5 rounded-md px-2.5 py-2 ${
                                    isMine ? "bg-white/10" : "bg-white border border-[#E5E5E5]"
                                  }`}
                                >
                                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isMine ? "text-white/40" : "text-[#9E9E9E]"}`}>
                                    AI 번역 → {isMsgPm ? "개발자 용어" : "기획자 용어"}
                                  </p>
                                  <p className={`text-[11px] italic leading-relaxed ${isMine ? "text-white/60" : "text-gray-500"}`}>
                                    {getAiTranslation(message.id, message.role)}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input area */}
                <div className="p-2 border-t border-[#E5E5E5] space-y-2 shrink-0">
                  <div className="flex gap-1.5">
                    <input
                      value={newMessage}
                      maxLength={PROPOSAL_MESSAGE_MAX_LENGTH}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={selectedProposal.status !== "pending"}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                        e.preventDefault();
                        submitMessage();
                      }}
                      placeholder="협의 내용을 입력하세요"
                      className="flex-1 rounded-lg border border-[#E5E5E5] px-2 py-1.5 text-[11px] focus:border-gray-900 focus:outline-none placeholder:text-[#C4C4C4] disabled:bg-[#F5F5F5]"
                    />
                    <button
                      onClick={submitMessage}
                      disabled={selectedProposal.status !== "pending"}
                      className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-2 text-white hover:bg-gray-800 disabled:bg-[#E5E5E5] transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {proposalNeedsValue(selectedProposal.action) && (
                    <div className="flex gap-1.5">
                      <input
                        value={proposalDraft}
                        maxLength={PROPOSAL_DRAFT_MAX_LENGTH}
                        disabled={selectedProposal.status !== "pending"}
                        onChange={(e) => setProposalDraft(e.target.value)}
                        placeholder="최종안"
                        className="flex-1 rounded-lg border border-[#E5E5E5] px-2 py-1.5 text-[11px] focus:border-gray-900 focus:outline-none disabled:bg-[#F5F5F5]"
                      />
                      <button
                        onClick={saveDraft}
                        disabled={selectedProposal.status !== "pending"}
                        className="rounded-lg border border-[#E5E5E5] px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-[#F5F5F5] disabled:opacity-50 transition-colors"
                      >
                        업데이트
                      </button>
                    </div>
                  )}

                  {/* Confirm status */}
                  <div className="rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-2.5 py-2 text-[11px] space-y-1">
                    <p className="flex items-center justify-between">
                      <span className="text-[#9E9E9E]">기획 확인</span>
                      <span className={selectedProposal.pmConfirmed ? "font-semibold text-gray-900" : "text-[#C4C4C4]"}>
                        {selectedProposal.pmConfirmed ? "완료" : "대기"}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-[#9E9E9E]">개발 확인</span>
                      <span className={selectedProposal.devConfirmed ? "font-semibold text-gray-900" : "text-[#C4C4C4]"}>
                        {selectedProposal.devConfirmed ? "완료" : "대기"}
                      </span>
                    </p>
                  </div>

                  {selectedProposal.status === "pending" && (
                    <button
                      onClick={() => onToggleConfirm(selectedProposal.id)}
                      disabled={
                        proposalNeedsValue(selectedProposal.action) &&
                        !selectedProposal.proposedValue?.trim()
                      }
                      className="w-full rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-800 disabled:bg-[#E5E5E5] disabled:text-[#9E9E9E] transition-colors"
                    >
                      {isPm
                        ? selectedProposal.pmConfirmed
                          ? "기획 확인 취소"
                          : "기획 최종안 확인"
                        : selectedProposal.devConfirmed
                          ? "개발 확인 취소"
                          : "개발 최종안 확인"}
                    </button>
                  )}

                  {selectedProposal.resultMessage && (
                    <div className="rounded-md border border-[#E5E5E5] bg-[#F5F5F5] px-2 py-1.5 text-[11px] text-gray-700">
                      {selectedProposal.resultMessage}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status tab */}
      {activeTab === "status" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center gap-3 text-xs text-[#9E9E9E] mb-2">
            <span>
              대기 <strong className="text-gray-900">{pendingCount}</strong>
            </span>
            <span>
              완료 <strong className="text-gray-900">
                {pipelineProposals.filter((p) => p.status !== "pending").length}
              </strong>
            </span>
          </div>

          {pipelineProposals.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-3 text-xs text-[#9E9E9E]">
              등록된 제안이 없습니다.
            </div>
          )}

          {pipelineProposals.map((proposal) => (
            <button
              key={proposal.id}
              onClick={() => { setSelectedProposalId(proposal.id); setActiveTab("chat"); }}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-left text-xs space-y-1 hover:bg-[#F5F5F5] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-800">
                  {getProposalActionLabel(proposal.action)}
                </p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    proposal.status === "pending"
                      ? "bg-[#6366F1]/10 text-[#6366F1]"
                      : proposal.status === "approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                  }`}
                >
                  {proposal.status === "pending" ? "진행중" : proposal.status === "approved" ? "반영완료" : "중단"}
                </span>
              </div>
              <p className="text-[#9E9E9E] break-words leading-snug">
                {getProposalTargetText(proposal)}
              </p>
              <p className="text-[10px] text-[#C4C4C4]">
                {proposal.createdAt}
                {proposal.closedAt ? ` · 종료 ${proposal.closedAt}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
