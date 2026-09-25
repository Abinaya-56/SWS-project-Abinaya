import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import './App.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      showError(err.message);
    }
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowed = ['.txt', '.md', '.json'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      showError('Invalid file type. Only .txt, .md, .json are allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Fake progress for UI
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 100);

      const res = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      await fetchDocuments();
    } catch (err) {
      showError(err.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete document');
      fetchDocuments();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDownload = (id, name) => {
    window.location.href = `${API_BASE_URL}/api/documents/${id}/download`;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newMessages = [...messages, { role: 'user', text: question }];
    setMessages(newMessages);
    const currentQ = question;
    setQuestion('');
    setLoadingChat(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');
      
      setMessages([...newMessages, { role: 'ai', text: data.answer, sources: data.sources }]);
    } catch (err) {
      showError(err.message);
      setMessages([...newMessages, { role: 'ai', text: 'Error: ' + err.message }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="app-container">
      {error && <div className="toast-error">{error}</div>}
      
      <header className="header">
        <h1>DocuMind AI</h1>
        <p>Manage documents & ask questions instantly</p>
      </header>
      
      <main className="main-content">
        <section className="left-panel">
          <div className="upload-section" onDrop={onDrop} onDragOver={onDragOver}>
            <div className="upload-box" onClick={() => fileInputRef.current.click()}>
              <span className="upload-icon">📄</span>
              <h3>Drag & drop a file here</h3>
              <p>or click to browse (.txt, .md, .json)</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept=".txt,.md,.json"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>
            {uploading && (
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>

          <div className="document-list">
            <h2>Your Documents</h2>
            {documents.length === 0 ? (
              <p className="no-docs">No documents uploaded yet.</p>
            ) : (
              <ul>
                {documents.map(doc => (
                  <li key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <span className="doc-name">{doc.originalName}</span>
                      <span className="doc-meta">{formatSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="doc-actions">
                      <button className="btn-icon" onClick={() => handleDownload(doc.id, doc.originalName)} title="Download">⬇️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(doc.id)} title="Delete">🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="right-panel chat-section">
          <h2>AI Assistant</h2>
          <div className="chat-history">
            {messages.length === 0 && (
              <div className="empty-chat">Ask a question based on your uploaded documents!</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="msg-bubble">
                  {msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="msg-sources">
                    <span>Sources:</span>
                    {msg.sources.map(s => (
                      <span key={s._id} className="source-chip">{s.originalName}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loadingChat && <div className="chat-message ai"><div className="msg-bubble typing">Thinking...</div></div>}
          </div>
          
          <form className="chat-input-form" onSubmit={handleChat}>
            <input 
              type="text" 
              placeholder="Ask anything..." 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loadingChat}
            />
            <button type="submit" disabled={loadingChat || !question.trim()}>Send</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
