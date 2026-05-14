import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CardGrid from '../components/CardGrid';
import Roadmap from '../components/Roadmap';
import DocumentLibrary from '../components/DocumentLibrary';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const { user, loading: authLoading, API_URL, updateCredits } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('file');
  const [activeView, setActiveView] = useState('cards');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [topic, setTopic] = useState('');
  const [savedSessions, setSavedSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Listen for generate-from-doc events
  useEffect(() => {
    const handleGenerateFromDoc = (event) => {
      const doc = event.detail;
      setSelectedDocument(doc);
      setActiveView('cards');
      handleGenerateFromDocument(doc);
    };

    window.addEventListener('generate-from-doc', handleGenerateFromDoc);
    return () => window.removeEventListener('generate-from-doc', handleGenerateFromDoc);
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`, {
        withCredentials: true
      });
      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleGenerateFromFile = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('num_cards', numCards);

      const response = await axios.post(
        `${API_URL}/cards/generate-from-file`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      setCards(response.data.cards);
      updateCredits(response.data.creditsRemaining);
      setSuccess(`Generated ${response.data.cards.length} cards! Used ${response.data.creditsUsed} credits.`);
      setFile(null);
      if (!topic && file) {
        setTopic(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cards');
      if (err.response?.data?.showRecharge) {
        setTimeout(() => navigate('/pricing'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromDocument = async (doc) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/cards/generate-from-document`,
        { documentId: doc._id, num_cards: numCards },
        { withCredentials: true }
      );
      
      setCards(response.data.cards);
      updateCredits(response.data.creditsRemaining);
      setSuccess(`Generated ${response.data.cards.length} cards from "${doc.originalName}"! Used ${response.data.creditsUsed} credits.`);
      setTopic(doc.originalName.replace(/\.[^/.]+$/, ""));
      
      // Save session automatically
      await saveSession(response.data.cards, doc);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cards from document');
      if (err.response?.data?.showRecharge) {
        setTimeout(() => navigate('/pricing'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (generatedCards, document = null) => {
    try {
      const sessionData = {
        title: topic || (document ? document.originalName : 'Untitled Session'),
        topic: topic || (document ? document.originalName.replace(/\.[^/.]+$/, "") : 'General'),
        cards: generatedCards,
        sourceType: document ? 'document' : (file ? 'file' : 'text'),
        documentId: document ? document._id : null
      };

      const response = await axios.post(
        `${API_URL}/sessions`,
        sessionData,
        { withCredentials: true }
      );

      // Update document session count if from document
      if (document) {
        await axios.put(
          `${API_URL}/documents/${document._id}`,
          { incrementSessionCount: true },
          { withCredentials: true }
        );
      }

      setCurrentSession(response.data.session);
      return response.data.session;
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const handleGenerateFromText = async (e) => {
    e.preventDefault();
    if (!text || text.length < 100) {
      setError('Text must be at least 100 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/cards/generate-from-text`,
        { text, num_cards: numCards },
        { withCredentials: true }
      );
      
      setCards(response.data.cards);
      updateCredits(response.data.creditsRemaining);
      setSuccess(`Generated ${response.data.cards.length} cards! Used ${response.data.creditsUsed} credits.`);
      setText('');
      if (!topic) {
        setTopic('Study Topic');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cards');
      if (err.response?.data?.showRecharge) {
        setTimeout(() => navigate('/pricing'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>📚 Menu</h3>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-item ${activeView === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveView('cards')}
            >
              <span className="sidebar-icon">🎴</span>
              <span className="sidebar-text">Study Cards</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveView('summary')}
            >
              <span className="sidebar-icon">📝</span>
              <span className="sidebar-text">Summary</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'roadmap' ? 'active' : ''}`}
              onClick={() => setActiveView('roadmap')}
            >
              <span className="sidebar-icon">🗺️</span>
              <span className="sidebar-text">Learning Roadmap</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveView('quiz')}
            >
              <span className="sidebar-icon">❓</span>
              <span className="sidebar-text">Quiz</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'database' ? 'active' : ''}`}
              onClick={() => setActiveView('database')}
            >
              <span className="sidebar-icon">🗄️</span>
              <span className="sidebar-text">My Database</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveView('documents')}
            >
              <span className="sidebar-icon">📄</span>
              <span className="sidebar-text">Documents</span>
            </button>
            
            <button 
              className={`sidebar-item ${activeView === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveView('analytics')}
            >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Analytics</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Cards View */}
          {activeView === 'cards' && (
            <>
              <div className="input-section">
                <h2>Generate Study Cards</h2>
                
                <div className="tabs">
                  <button 
                    className={activeTab === 'file' ? 'active' : ''} 
                    onClick={() => setActiveTab('file')}
                  >
                    📁 Upload File
                  </button>
                  <button 
                    className={activeTab === 'text' ? 'active' : ''} 
                    onClick={() => setActiveTab('text')}
                  >
                    ✏️ Paste Text
                  </button>
                  <button 
                    className={activeTab === 'docs' ? 'active' : ''} 
                    onClick={() => setActiveTab('docs')}
                  >
                    📚 From Documents
                  </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {activeTab === 'file' ? (
            <form onSubmit={handleGenerateFromFile} className="input-form">
              <div className="form-group">
                <label>📝 Upload File (PDF, TXT, or Image for Handwritten Notes)</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.jpg,.jpeg,.png,.bmp,.tiff"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {file && <p className="file-name">Selected: {file.name}</p>}
              </div>
              
              <div className="form-group">
                <label>Number of Cards</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numCards}
                  onChange={(e) => setNumCards(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Cards'}
              </button>
            </form>
          ) : activeTab === 'docs' ? (
            <div className="docs-selection">
              <h3>Select a document to generate cards:</h3>
              {documents.length === 0 ? (
                <div className="empty-docs">
                  <p>📭 No documents uploaded yet</p>
                  <p>Go to the Documents section to upload your files first.</p>
                  <button 
                    onClick={() => setActiveView('documents')}
                    className="go-to-docs-btn"
                  >
                    📄 Go to Documents
                  </button>
                </div>
              ) : (
                <div className="docs-grid">
                  {documents.map((doc) => (
                    <div key={doc._id} className="doc-card-select">
                      <div className="doc-icon-large">
                        {doc.fileType.includes('pdf') ? '📄' : 
                         doc.fileType.includes('word') ? '📝' : '📃'}
                      </div>
                      <div className="doc-info-select">
                        <h4>{doc.originalName}</h4>
                        <p className="doc-size-select">
                          {(doc.fileSize / 1024).toFixed(2)} KB
                        </p>
                        {doc.sessionCount > 0 && (
                          <p className="doc-sessions-select">
                            🎴 {doc.sessionCount} session(s)
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleGenerateFromDocument(doc)}
                        disabled={loading}
                        className="select-doc-btn"
                      >
                        {loading ? '⏳ Generating...' : '🎴 Generate Cards'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-group" style={{marginTop: '20px'}}>
                <label>Number of Cards</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numCards}
                  onChange={(e) => setNumCards(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateFromText} className="input-form">
              <div className="form-group">
                <label>Paste Your Text (min 100 characters)</label>
                <textarea
                  rows="10"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your educational content here..."
                  disabled={loading}
                />
                <small>{text.length} characters</small>
              </div>
              
              <div className="form-group">
                <label>Number of Cards</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numCards}
                  onChange={(e) => setNumCards(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Cards'}
              </button>
            </form>
          )}
              </div>

              {cards.length > 0 && (
                <>
                  <CardGrid cards={cards} />
                </>
              )}
            </>
          )}

          {/* Summary View */}
          {activeView === 'summary' && (
            <div className="view-content">
              <h2>📝 Summary</h2>
              {cards.length > 0 ? (
                <div className="summary-container">
                  <div className="summary-stats">
                    <div className="stat-card">
                      <span className="stat-number">{cards.length}</span>
                      <span className="stat-label">Total Cards</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{cards.filter(c => c.importance >= 4).length}</span>
                      <span className="stat-label">High Priority</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{new Set(cards.map(c => c.category)).size}</span>
                      <span className="stat-label">Categories</span>
                    </div>
                  </div>
                  
                  <div className="summary-content">
                    <h3>Topic: {topic || 'Study Material'}</h3>
                    <div className="summary-cards-list">
                      {cards.map((card, index) => (
                        <div key={index} className="summary-card-item">
                          <h4>{'⭐'.repeat(card.importance)} {card.title}</h4>
                          <p className="summary-card-category">{card.category}</p>
                          <p className="summary-card-text">{card.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>📚 Generate cards first to see the summary</p>
                  <button onClick={() => setActiveView('cards')} className="primary-btn">
                    Generate Cards
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Roadmap View */}
          {activeView === 'roadmap' && (
            <div className="view-content">
              <h2>🗺️ Learning Roadmap</h2>
              {cards.length > 0 ? (
                <Roadmap cards={cards} topic={topic} />
              ) : (
                <div className="empty-state">
                  <p>🗺️ Generate cards first to create a learning roadmap</p>
                  <button onClick={() => setActiveView('cards')} className="primary-btn">
                    Generate Cards
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz View */}
          {activeView === 'quiz' && (
            <div className="view-content">
              <h2>❓ Quiz</h2>
              {cards.length > 0 ? (
                <div className="quiz-container">
                  <div className="coming-soon">
                    <h3>🚀 Quiz Feature Coming Soon!</h3>
                    <p>Test your knowledge with AI-generated quizzes based on your study cards.</p>
                    <div className="quiz-preview">
                      <p>Features will include:</p>
                      <ul>
                        <li>✅ Multiple choice questions</li>
                        <li>✅ True/False questions</li>
                        <li>✅ Fill in the blanks</li>
                        <li>✅ Instant feedback and scoring</li>
                        <li>✅ Progress tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>❓ Generate cards first to take a quiz</p>
                  <button onClick={() => setActiveView('cards')} className="primary-btn">
                    Generate Cards
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Database View */}
          {activeView === 'database' && (
            <div className="view-content">
              <h2>🗄️ My Database</h2>
              <div className="database-container">
                <div className="coming-soon">
                  <h3>🗄️ Database Feature Coming Soon!</h3>
                  <p>Save, organize, and manage all your generated cards in one place.</p>
                  <div className="database-preview">
                    <p>Features will include:</p>
                    <ul>
                      <li>📁 Organize cards by subjects</li>
                      <li>🔍 Search and filter cards</li>
                      <li>⭐ Favorite important cards</li>
                      <li>📝 Edit and customize cards</li>
                      <li>💾 Auto-save your work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents View */}
          {activeView === 'documents' && (
            <div className="view-content" style={{padding: 0}}>
              <DocumentLibrary />
            </div>
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <div className="view-content">
              <h2>📊 Analytics</h2>
              <div className="analytics-container">
                <div className="coming-soon">
                  <h3>📊 Analytics Dashboard Coming Soon!</h3>
                  <p>Track your learning progress and study patterns.</p>
                  <div className="analytics-preview">
                    <p>Features will include:</p>
                    <ul>
                      <li>📈 Study time tracking</li>
                      <li>🎯 Card mastery levels</li>
                      <li>📅 Study streak calendar</li>
                      <li>💪 Performance insights</li>
                      <li>🏆 Achievements and badges</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
