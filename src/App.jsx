import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (selectedFile) => {
    if (!selectedFile) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setDocumentId(res.data.document_id);
      setMessages([
        { role: "system", content: "Document uploaded successfully ✅" },
      ]);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        query: question,
      });

      const aiMessage = { role: "ai", content: res.data.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      alert("Error asking question");
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
                setFile(e.target.files[0]);
                uploadFile(e.target.files[0]);
              }}
            />
            <label htmlFor="fileUpload" className="browse-btn">
              Browse File
            </label>
          </div>

          {documentId && (
            <div className="success-msg">Document ready for questions ✅</div>
          )}
        </div>

        {/* CHAT AREA */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className="loader">
                <div className="spinner"></div>
                AI is thinking...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={question}
              placeholder="Ask something about your document..."
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            />
            <button onClick={askQuestion}>Send</button>
          </div>
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
