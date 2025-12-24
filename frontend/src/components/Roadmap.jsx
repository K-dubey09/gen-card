import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Roadmap.css';

function Roadmap({ cards, topic }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { API_URL } = useAuth();

  const generateRoadmap = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/roadmap/generate`,
        { cards, topic },
        { withCredentials: true }
      );

      setRoadmap(response.data.roadmap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (color) => {
    const colors = {
      blue: '#4facfe',
      green: '#43e97b',
      purple: '#a855f7',
      orange: '#fa709a',
      red: '#ff6b6b',
      teal: '#06b6d4',
      pink: '#ec4899',
      indigo: '#6366f1'
    };
    return colors[color] || colors.blue;
  };

  if (!roadmap) {
    return (
      <div className="roadmap-generator">
        <button onClick={generateRoadmap} disabled={loading} className="generate-roadmap-btn">
          {loading ? '🔄 Generating Roadmap...' : '🗺️ Generate Learning Roadmap'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h2>🗺️ {roadmap.title}</h2>
        <p className="roadmap-description">{roadmap.description}</p>
        <div className="roadmap-meta">
          <span className="estimated-time">⏱️ {roadmap.estimatedTime}</span>
          <button onClick={() => setRoadmap(null)} className="regenerate-btn">
            🔄 Regenerate
          </button>
        </div>
      </div>

      <div className="roadmap-timeline">
        {roadmap.phases?.map((phase, index) => (
          <div key={index} className="phase-container">
            <div 
              className="phase-card"
              style={{ 
                borderLeft: `5px solid ${getPhaseColor(phase.color)}`,
                background: `linear-gradient(135deg, ${getPhaseColor(phase.color)}15 0%, ${getPhaseColor(phase.color)}05 100%)`
              }}
            >
              {phase.imageUrl && (
                <div className="phase-image-container">
                  <img 
                    src={phase.imageUrl} 
                    alt={phase.phaseName} 
                    className="phase-image"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <div className="phase-image-overlay" style={{ background: `linear-gradient(to bottom, transparent, ${getPhaseColor(phase.color)}88)` }}></div>
                </div>
              )}
              
              <div className="phase-content">
                <div className="phase-header">
                  <div className="phase-number" style={{ background: getPhaseColor(phase.color) }}>
                    {phase.icon || '📚'} Phase {phase.phaseNumber}
                  </div>
                  <h3>{phase.phaseName}</h3>
                </div>

              <p className="phase-description">{phase.description}</p>

              <div className="phase-time">
                <span>📅 Duration: {phase.estimatedTime}</span>
              </div>

              <div className="phase-cards">
                <h4>📚 Study Cards in this Phase:</h4>
                <div className="mini-cards">
                  {phase.cardIndices?.map((cardIdx) => {
                    const card = cards[cardIdx];
                    return card ? (
                      <div key={cardIdx} className="mini-card">
                        {card.imageUrl && (
                          <img 
                            src={card.imageUrl} 
                            alt={card.title} 
                            className="mini-card-image"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div className="mini-card-content">
                          <span className="mini-card-title">{card.title}</span>
                          <span className="mini-card-category">{card.category}</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {phase.tips && phase.tips.length > 0 && (
                <div className="phase-tips">
                  <h4>💡 Learning Tips:</h4>
                  <ul>
                    {phase.tips.map((tip, tipIdx) => (
                      <li key={tipIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </div>

            {index < roadmap.phases.length - 1 && (
              <div className="phase-connector">
                <div className="connector-line"></div>
                <div className="connector-arrow">↓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {roadmap.connections && roadmap.connections.length > 0 && (
        <div className="roadmap-connections">
          <h3>🔗 Card Dependencies</h3>
          <div className="connections-grid">
            {roadmap.connections.map((conn, idx) => (
              <div key={idx} className="connection-item">
                <span className="connection-from">{cards[conn.from]?.title}</span>
                <span className="connection-arrow">→</span>
                <span className="connection-to">{cards[conn.to]?.title}</span>
                <span className="connection-type">{conn.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="roadmap-footer">
        <button onClick={() => window.print()} className="print-roadmap-btn">
          🖨️ Print Roadmap
        </button>
        <button onClick={() => {
          const data = JSON.stringify(roadmap, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'learning-roadmap.json';
          link.click();
        }} className="export-roadmap-btn">
          📥 Export JSON
        </button>
      </div>
    </div>
  );
}

export default Roadmap;
