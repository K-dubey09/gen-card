import { useEffect, useState } from 'react';
import './CardGrid.css';

function CardGrid({ cards }) {
  const [filter, setFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selectedCard !== null || fullscreenImage ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCard, fullscreenImage]);

  const filteredCards = filter === 'all' 
    ? cards 
    : cards.filter(card => card.importance >= parseInt(filter));

  const exportToJSON = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-cards.json';
    link.click();
  };

  const exportToText = () => {
    const text = cards.map((card, index) => 
      `Card ${index + 1}: ${card.title}\nCategory: ${card.category}\nImportance: ${card.importance}/5\n\n${card.content}\n\n${card.keyPoints ? 'Key Points:\n' + card.keyPoints.map(p => `• ${p}`).join('\n') : ''}\n\n${'-'.repeat(50)}\n`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-cards.txt';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'card-blue',
      green: 'card-green',
      purple: 'card-purple',
      orange: 'card-orange',
      red: 'card-red',
      teal: 'card-teal',
      pink: 'card-pink',
      indigo: 'card-indigo'
    };
    return colorMap[color] || 'card-blue';
  };

  const openFullscreenImage = (card) => {
    const imageUrl = card?.imageUrl || card?.fallbackImageUrl;
    if (imageUrl) {
      setFullscreenImage(imageUrl);
    }
  };

  const closeFullscreenImage = () => {
    setFullscreenImage(null);
  };

  return (
    <div className="card-grid-container">
      <div className="card-controls">
        <h3>📚 {filteredCards.length} Study Cards</h3>
        
        <div className="controls-group">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Cards</option>
            <option value="5">⭐⭐⭐⭐⭐ Priority 5</option>
            <option value="4">⭐⭐⭐⭐ Priority 4+</option>
            <option value="3">⭐⭐⭐ Priority 3+</option>
          </select>
          
          <button onClick={exportToJSON} className="control-btn btn-blue">
            📥 JSON
          </button>
          <button onClick={exportToText} className="control-btn btn-green">
            📄 Text
          </button>
          <button onClick={handlePrint} className="control-btn btn-purple">
            🖨️ Print
          </button>
        </div>
      </div>

      <div className="cards-grid">
        {filteredCards.map((card, index) => (
          <div 
            key={index} 
            className={`card ${getColorClass(card.color)} ${selectedCard === index ? 'card-expanded' : ''}`}
            onClick={() => setSelectedCard(selectedCard === index ? null : index)}
          >
            {card.imageUrl && (
              <div className="card-image-container">
                <img 
                  src={card.imageUrl} 
                  alt={card.title} 
                  className="card-image"
                  onError={(e) => {
                    console.log('Image failed to load:', card.imageUrl);
                    if (card.fallbackImageUrl && e.target.src !== card.fallbackImageUrl) {
                      e.target.src = card.fallbackImageUrl;
                      return;
                    }
                    e.target.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    console.log('Image loaded successfully:', card.imageUrl);
                  }}
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            
            <div className="card-header">
              <span className="card-category">
                <span className="category-icon">📚</span>
                {card.category}
              </span>
              <span className="card-importance">
                {'⭐'.repeat(card.importance)}
              </span>
            </div>
            
            <h3 className="card-title">
              <span className="title-icon">💡</span>
              {card.title}
            </h3>
            
            {card.summary && (
              <div className="card-summary">
                <em>{card.summary}</em>
              </div>
            )}
            
            {card.keyPoints && card.keyPoints.length > 0 && (
              <div className="card-key-points">
                <div className="key-points-title">🔑 Key Points:</div>
                <ul>
                  {card.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="card-content">
              <div className="content-label">📝 Details:</div>
              <p>{card.content}</p>
            </div>
            
            <div className="card-footer">
              <span className="card-number">#{index + 1}</span>
              <span className="expand-hint">
                {selectedCard === index ? '👆 Click to collapse' : '👆 Click to expand'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedCard !== null && (
        <div className="card-overlay" onClick={() => setSelectedCard(null)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCard(null)} aria-label="Close card">×</button>
            <div className={`modal-content ${getColorClass(filteredCards[selectedCard]?.color)}`}>
              {filteredCards[selectedCard]?.imageUrl && (
                <button
                  type="button"
                  className="modal-image-container"
                  onClick={() => openFullscreenImage(filteredCards[selectedCard])}
                  aria-label="Open image fullscreen"
                >
                  <img 
                    src={filteredCards[selectedCard].imageUrl} 
                    alt={filteredCards[selectedCard].title}
                    className="modal-image"
                    onError={(e) => {
                      const fallbackImageUrl = filteredCards[selectedCard]?.fallbackImageUrl;
                      if (fallbackImageUrl && e.target.src !== fallbackImageUrl) {
                        e.target.src = fallbackImageUrl;
                        return;
                      }
                      e.target.style.display = 'none';
                    }}
                  />
                </button>
              )}

              <div className="modal-scroll">
                <div className="modal-header">
                  <h2>{filteredCards[selectedCard]?.title}</h2>
                  <span className="modal-category">{filteredCards[selectedCard]?.category}</span>
                </div>
                
                {filteredCards[selectedCard]?.summary && (
                  <div className="modal-summary">
                    <strong>Summary:</strong> {filteredCards[selectedCard].summary}
                  </div>
                )}
                
                {filteredCards[selectedCard]?.keyPoints && (
                  <div className="modal-key-points">
                    <h3>🔑 Key Points</h3>
                    <ul>
                      {filteredCards[selectedCard].keyPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="modal-details">
                  <h3>📝 Detailed Information</h3>
                  <p>{filteredCards[selectedCard]?.content}</p>
                </div>
                
                <div className="modal-footer">
                  <span className="modal-importance">
                    Importance: {'⭐'.repeat(filteredCards[selectedCard]?.importance || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="image-fullscreen-overlay" onClick={closeFullscreenImage}>
          <button
            type="button"
            className="fullscreen-close"
            onClick={(e) => {
              e.stopPropagation();
              closeFullscreenImage();
            }}
            aria-label="Close fullscreen image"
          >
            ×
          </button>
          <img
            src={fullscreenImage}
            alt="Card full screen"
            className="image-fullscreen"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default CardGrid;
