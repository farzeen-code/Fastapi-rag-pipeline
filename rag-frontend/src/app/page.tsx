"use client";

import { useState, useRef, useEffect, useId } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface UploadedFile {
  name: string;
  wordCount: number;
  mode: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    setSessionId("session_" + Math.random().toString(36).substring(2, 9));
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add 'selectedFile: File' as a parameter
  const handleUpload = async (selectedFile: File) => {
    setIsUploading(true);
    setUploadStatus("Uploading & indexing document...");

    const formData = new FormData();
    formData.append("file", selectedFile); // Use the parameter here

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedFile({
          name: selectedFile.name, // Use the parameter here
          wordCount: data.word_count,
          mode: data.mode,
        });
        setUploadStatus("Document indexed successfully!");
        setTimeout(() => setUploadStatus(""), 3000);
      } else {
        setUploadStatus(`Error: ${data.detail || "Upload failed"}`);
      }
    } catch {
      setUploadStatus("Error connecting to server.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;
    try {
      await fetch(`${API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadedFile.name }),
      });
    } catch {
      // silent fail
    }
    setUploadedFile(null);
    setFile(null);
    setUploadStatus("");
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userText = question;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsAsking(true);

    try {
      const res = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question: userText,
          filename: uploadedFile?.name || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Backend error");
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to connect to the server. Please try again.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">📄</span> Farzeen's AI
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI Document Assistant</p>
        </div>

        {/* Upload */}
        <div className="p-4 border-b border-gray-800">
          <label className="w-full cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setUploadStatus("");
                  handleUpload(f);
                }
              }}
            />
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Upload Document
                </>
              )}
            </div>
          </label>

          {file && !uploadedFile && (
            <p className="text-xs text-gray-400 mt-2 text-center truncate px-1">
              {file.name}
            </p>
          )}
          {uploadStatus && (
            <p
              className={`text-xs mt-2 text-center ${uploadStatus.includes("Error") ? "text-red-400" : "text-green-400"
                }`}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Loaded Document */}
        {uploadedFile && (
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
              Loaded Document
            </p>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {uploadedFile.wordCount.toLocaleString()} words ·{" "}
                    {uploadedFile.mode === "full-context" ? "Full context" : "RAG"}
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1 rounded hover:bg-gray-700"
                  title="Remove document"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="mt-auto p-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 mb-1">Session</p>
          <p className="text-xs text-gray-400 font-mono truncate">{sessionId}</p>
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  Ask anything about your document
                </h2>
                <p className="text-sm text-gray-400">
                  {uploadedFile
                    ? `Ready to answer questions about ${uploadedFile.name}`
                    : "Upload a document from the sidebar to get started"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index}>
                <ChatMessage message={msg} />
                {msg.role === "assistant" &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <SourcesPanel sources={msg.sources} />
                  )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isAsking && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleAsk} className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                uploadedFile
                  ? `Ask about ${uploadedFile.name}...`
                  : "Upload a document first, then ask a question..."
              }
              disabled={isAsking}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim() || !uploadedFile}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isAsking ? (
                "Thinking..."
              ) : (
                <>
                  Send
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ── Chat Message ── */
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-blue-100" : "bg-blue-100"
          }`}
      >
        <span className="text-sm">{isUser ? "👤" : "🤖"}</span>
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sources (below assistant messages) ── */
function SourcesPanel({ sources }: { sources: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ml-11 mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {isOpen ? "▾" : "▸"} {sources.length} source chunks
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600 border border-gray-200"
            >
              <span className="font-semibold text-gray-500">Chunk {idx + 1}</span>
              <p className="mt-1 leading-relaxed">{src}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
