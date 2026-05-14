import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './Transactions.css';

function Transactions() {
  const { user, loading: authLoading, API_URL } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchTransactions();
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/transactions`, {
        withCredentials: true
      });
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'purchase': return '💳';
      case 'usage': return '📝';
      case 'bonus': return '🎁';
      default: return '📊';
    }
  };

  if (authLoading || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="transactions-page">
      <Navbar />
      
      <div className="transactions-content">
        <h1>Transaction History</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions yet</p>
            <button onClick={() => navigate('/pricing')} className="recharge-btn">
              Recharge Credits
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="transaction-details">
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
