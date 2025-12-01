import { useState } from 'react';
import './CardGrid.css';

function CardGrid({ cards }) {
  const [filter, setFilter] = useState('all');

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
      `Card ${index + 1}: ${card.title}\nCategory: ${card.category}\nImportance: ${card.importance}/5\n\n${card.content}\n\n${'-'.repeat(50)}\n`
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

  return (
    <div className="card-grid-container">
      <div className="card-controls">
        <h3>{filteredCards.length} Cards</h3>
        
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
          
          <button onClick={exportToJSON} className="control-btn">
            📥 Export JSON
          </button>
          <button onClick={exportToText} className="control-btn">
            📄 Export Text
          </button>
          <button onClick={handlePrint} className="control-btn">
            🖨️ Print
          </button>
        </div>
      </div>

      <div className="cards-grid">
        {filteredCards.map((card, index) => (
          <div key={index} className="card">
            <div className="card-header">
              <span className="card-category">{card.category}</span>
              <span className="card-importance">
                {'⭐'.repeat(card.importance)}
              </span>
            </div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-content">{card.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardGrid;
