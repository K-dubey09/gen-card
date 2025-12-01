import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CardGrid from '../components/CardGrid';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const { user, loading: authLoading, API_URL, updateCredits } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

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
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cards');
      if (err.response?.data?.showRecharge) {
        setTimeout(() => navigate('/pricing'), 2000);
      }
    } finally {
      setLoading(false);
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
      
      <div className="main-content">
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
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'file' ? (
            <form onSubmit={handleGenerateFromFile} className="input-form">
              <div className="form-group">
                <label>Upload PDF or Text File</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
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

        {cards.length > 0 && <CardGrid cards={cards} />}
      </div>
    </div>
  );
}

export default Dashboard;
