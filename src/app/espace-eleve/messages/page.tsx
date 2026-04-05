"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faPaperPlane,
  faSpinner,
  faInbox,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

interface Conversation {
  partnerId: string;
  partnerNom: string;
  partnerPrenom: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  contenu: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; prenom: string; nom: string };
  reservation?: {
    id: string;
    numero: string;
    session: { formation: { titre: string } };
  } | null;
}

export default function EleveMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setCurrentUserId(data.id);
      })
      .catch(() => {});
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch messages when selecting a conversation
  useEffect(() => {
    if (!selectedPartner) return;
    setLoadingMessages(true);
    fetch(`/api/messages/${selectedPartner}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false));

    // Mark as read
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: selectedPartner }),
    }).catch(() => {});
  }, [selectedPartner]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedPartner,
          contenu: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === selectedPartner
              ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  const selectedConversation = conversations.find(
    (c) => c.partnerId === selectedPartner
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
        <FontAwesomeIcon icon={faComments} className="text-blue-400" />
        Messages
      </h1>

      <div
        className="flex rounded-xl border overflow-hidden"
        style={{
          background: "#0D1D3A",
          borderColor: "rgba(255,255,255,0.07)",
          height: "calc(100vh - 220px)",
          minHeight: "500px",
        }}
      >
        {/* Conversations list */}
        <div
          className={`w-full sm:w-80 shrink-0 border-r flex flex-col ${
            selectedPartner ? "hidden sm:flex" : "flex"
          }`}
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="px-4 py-3 border-b text-sm font-medium text-gray-400"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-10">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-blue-400 animate-spin"
                />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FontAwesomeIcon
                  icon={faInbox}
                  className="text-gray-600 text-2xl mb-3"
                />
                <p className="text-gray-500 text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedPartner(conv.partnerId)}
                  className={`w-full text-left px-4 py-3.5 border-b transition-colors ${
                    selectedPartner === conv.partnerId
                      ? "bg-white/5"
                      : "hover:bg-white/3"
                  }`}
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                      <span className="text-blue-400 text-xs font-bold">
                        {conv.partnerPrenom[0]}
                        {conv.partnerNom[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-medium truncate">
                          {conv.partnerPrenom} {conv.partnerNom}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={`flex-1 flex flex-col ${
            selectedPartner ? "flex" : "hidden sm:flex"
          }`}
        >
          {selectedPartner && selectedConversation ? (
            <>
              {/* Chat header */}
              <div
                className="px-5 py-3 border-b flex items-center gap-3"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <button
                  className="sm:hidden text-gray-400 hover:text-white mr-1"
                  onClick={() => setSelectedPartner(null)}
                >
                  &larr;
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">
                    {selectedConversation.partnerPrenom[0]}
                    {selectedConversation.partnerNom[0]}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {selectedConversation.partnerPrenom}{" "}
                    {selectedConversation.partnerNom}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">
                    {selectedConversation.partnerRole
                      .replace("CENTRE_", "")
                      .replace("_", " ")
                      .toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center py-10">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="text-blue-400 animate-spin"
                    />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender.id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-white/8 text-gray-200 rounded-bl-md"
                          }`}
                        >
                          {msg.reservation && (
                            <p className="text-[10px] opacity-60 mb-1">
                              Re: {msg.reservation.session.formation.titre} (
                              {msg.reservation.numero})
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.contenu}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                            {isMine && msg.isRead && (
                              <span className="ml-1">
                                <FontAwesomeIcon
                                  icon={faCircle}
                                  className="w-1.5 h-1.5 inline text-blue-300"
                                />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                className="px-4 py-3 border-t flex items-center gap-3"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-30"
                >
                  {sending ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="w-4 h-4 animate-spin"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      className="w-4 h-4"
                    />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faComments}
                  className="text-gray-700 text-3xl mb-3"
                />
                <p className="text-gray-500 text-sm">
                  Selectionnez une conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
