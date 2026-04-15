import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // for chat
  const [uploading, setUploading] = useState(false); // ✅ for upload
  const [dragActive, setDragActive] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [summary, setSummary] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (selectedFile) => {
    if (!selectedFile) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setUploadProgress(0);
      setSummary("");

      // 🔥 Dummy progress animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setUploadProgress(progress);
        }
      }, 200);

      const res = await axios.post("http://127.0.0.1:8000/upload", formData);

      clearInterval(interval);
      setUploadProgress(100);

      console.log("UPLOAD RESPONSE:", res.data); // 🔍 debug

      setDocumentId(res.data.document_id);
      setSummary(res.data.summary); // ✅ summary

      setMessages([
        { role: "system", content: "Document uploaded successfully ✅" },
      ]);

      // small delay so user sees 100%
      setTimeout(() => {
        setUploading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", content: question };
    const tempAiMessage = { role: "ai", content: "", loading: true };

    setMessages((prev) => [...prev, userMessage, tempAiMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        query: question,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading ? { role: "ai", content: res.data.answer } : msg,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading
            ? { role: "ai", content: "Something went wrong ❌" }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
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
            <span>Supports PDF, DOCX, PPT, Excel, TXT</span>

            <input
              type="file"
              id="fileUpload"
              hidden
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
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
                      msg.content
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

      {/* FOOTER */}
      <footer className="footer">
        © {new Date().getFullYear()} Document AI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
