"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatSidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (c: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const confirmRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      onDeleteConversation(id);
    }
  };

  if (!isOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 px-2 border-r border-slate-200 bg-slate-50/50">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all cursor-pointer"
          title="Open Conversation History"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onNewChat}
          className="mt-4 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
          title="Start New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleCreateNew = () => {
    onNewChat();
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        onClick={onToggle}
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 border-r border-slate-200 bg-white lg:bg-slate-50/70 flex flex-col h-full flex-shrink-0 shadow-2xl lg:shadow-none lg:static lg:z-auto transition-all">
        {/* Header & New Chat */}
        <div className="p-3.5 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Conversations</h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
              title="Close Conversations"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {searchQuery ? "No matching conversations" : "No conversation history yet"}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditingThis = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-100 lg:bg-white text-slate-900 font-semibold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:bg-slate-50 lg:hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  {isEditingThis ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                {/* Actions (Rename / Delete) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditingThis ? (
                    <>
                      <button
                        onClick={(e) => confirmRename(conv.id, e)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={cancelRename} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startRename(conv, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
    </>
  );
}
