import { useState, useRef, useEffect } from "react";
import "./App.css";
import { api, API_BASE } from "./lib/api";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, logout } = useAuth();
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summary, setSummary] = useState("");
  const [activeMedia, setActiveMedia] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeMedia) return undefined;
    const isVideo = activeMedia.mediaType.startsWith("video/");
    const element = isVideo ? videoRef.current : audioRef.current;
    if (!element) return undefined;

    const stopAt = Number(activeMedia.endSec || 0);
    const startAt = Number(activeMedia.startSec || 0);

    const onLoaded = () => {
      element.currentTime = startAt;
      element.play().catch(() => {});
    };
    const onTimeUpdate = () => {
      if (stopAt > 0 && element.currentTime >= stopAt) {
        element.pause();
      }
    };

    element.addEventListener("loadedmetadata", onLoaded);
    element.addEventListener("timeupdate", onTimeUpdate);
    if (element.readyState >= 1) onLoaded();

    return () => {
      element.removeEventListener("loadedmetadata", onLoaded);
      element.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [activeMedia]);

  const toAbsoluteMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return "";
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) return mediaUrl;
    return `${API_BASE}${mediaUrl}`;
  };

  const playRelevantSegment = (source) => {
    setActiveMedia({
      url: toAbsoluteMediaUrl(source.media_url),
      mediaType: source.media_type || "audio/mpeg",
      startSec: source.start_sec || 0,
      endSec: source.end_sec || 0,
      filename: source.filename || "media",
    });
  };

  const uploadFile = async (selectedFile) => {
    if (!selectedFile) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setUploadProgress(0);
      setSummary("");
      setErrorMessage("");

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setUploadProgress(progress);
        }
      }, 200);

      const res = await api.post("/upload", formData);

      clearInterval(interval);
      setUploadProgress(100);

      setDocumentId(res.data.document_id);
      setSummary(res.data.summary || "");

      setMessages([
        { role: "system", content: "File uploaded and indexed successfully." },
      ]);

      setTimeout(() => {
        setUploading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || "Upload failed");
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    const query = question.trim();
    if (!query || loading) return;

    const userMessage = { role: "user", content: query };
    const tempAiMessage = { role: "ai", content: "", loading: true, sources: [] };
    setMessages((prev) => [...prev, userMessage, tempAiMessage]);
    setQuestion("");
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.post("/ask", { query });
      const answer = res.data?.answer || "No answer found.";
      const sources = Array.isArray(res.data?.sources) ? res.data.sources : [];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading
            ? { role: "ai", content: answer, loading: false, sources }
            : msg,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading
            ? { ...msg, content: "Something went wrong ❌", loading: false }
            : msg,
        ),
      );
      setErrorMessage(
        err.response?.data?.detail || "We could not complete your request.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    uploadFile(droppedFile);
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div
          className="logo"
          style={{ color: "black", fontSize: "35px", fontWeight: "bold" }}
        >
          Document AI
        </div>
        <div className="nav-actions">
          <span className="nav-user">{user?.email}</span>
          <button type="button" className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main">
        {/* LEFT PANEL */}
        <div className="sidebar">
          <h2>Upload Document</h2>

          <div
            className={`dropzone ${dragActive ? "active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <p>Drag & Drop your file here</p>
            <span>Supports PDF, DOCX, PPT, Excel, TXT, MP3, WAV, M4A, MP4, MOV, WEBM</span>

            <input
              type="file"
              id="fileUpload"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.wav,.m4a,.mp4,.mov,.webm"
              hidden
              onChange={(e) => {
                const f = e.target.files[0];
                uploadFile(f);
              }}
            />
            <label htmlFor="fileUpload" className="browse-btn">
              Browse File
            </label>
          </div>

          {/* ✅ Progress Bar */}
          {uploading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>{uploadProgress}% uploading...</p>
            </div>
          )}

          {/* ✅ Success */}
          {documentId && (
            <div className="success-msg">Document ready for questions ✅</div>
          )}

          {/* ✅ Summary */}
          {summary && (
            <div className="summary-box">
              <h4>📌 Summary</h4>
              <pre>{summary}</pre>
            </div>
          )}

          {errorMessage && <div className="error-msg">{errorMessage}</div>}
        </div>

        {/* CHAT AREA */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="chat-messages-empty">
              <div className="centered-input-wrapper">
                <div className="chat-input chat-input-centered">
                  <input
                    type="text"
                    value={question}
                    placeholder="Ask something about your document..."
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !loading && askQuestion()
                    }
                    disabled={loading}
                  />
                  <button onClick={askQuestion} disabled={loading}>
                    {loading ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    {msg.loading ? (
                      <div className="loader">
                        <div className="spinner"></div>
                        AI is thinking...
                      </div>
                    ) : (
                      <div className="message-body">
                        <div>{msg.content}</div>
                        {msg.role === "ai" && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                          <div className="source-list">
                            {msg.sources.map((source, sourceIndex) => (
                              <button
                                key={`${source.media_id || "media"}-${sourceIndex}`}
                                className="play-btn"
                                onClick={() => playRelevantSegment(source)}
                              >
                                Play relevant segment ({Math.floor(source.start_sec || 0)}s - {Math.floor(source.end_sec || 0)}s)
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  value={question}
                  placeholder="Ask something about your document..."
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !loading && askQuestion()
                  }
                  disabled={loading}
                />
                <button onClick={askQuestion} disabled={loading}>
                  {loading ? "..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {activeMedia && (
        <div className="media-player-panel">
          <h4>Relevant media segment: {activeMedia.filename}</h4>
          {activeMedia.mediaType.startsWith("video/") ? (
            <video ref={videoRef} controls src={activeMedia.url} />
          ) : (
            <audio ref={audioRef} controls src={activeMedia.url} />
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        © {new Date().getFullYear()} Document AI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
