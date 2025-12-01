import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './Pricing.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

const PACKAGES = {
  starter: { name: 'Starter', credits: 50, price: '$4.99', value: 499 },
  basic: { name: 'Basic', credits: 100, price: '$8.99', value: 899 },
  pro: { name: 'Pro', credits: 250, price: '$19.99', value: 1999 },
  premium: { name: 'Premium', credits: 500, price: '$34.99', value: 3499 }
};

function CheckoutForm({ packageName, packageInfo, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { API_URL, updateCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const intentResponse = await axios.post(
        `${API_URL}/payment/create-intent`,
        { packageName },
        { withCredentials: true }
      );

      const { clientSecret, credits } = intentResponse.data;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      // Confirm on backend
      const confirmResponse = await axios.post(
        `${API_URL}/payment/confirm`,
        { paymentIntentId: paymentIntent.id, packageName },
        { withCredentials: true }
      );

      updateCredits(confirmResponse.data.totalCredits);
      onSuccess(confirmResponse.data.creditsAdded);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="card-element-container">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#333',
                '::placeholder': { color: '#aaa' }
              }
            }
          }}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={!stripe || loading} className="pay-btn">
        {loading ? 'Processing...' : `Pay ${packageInfo.price}`}
      </button>
    </form>
  );
}

function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleSuccess = (creditsAdded) => {
    setSuccess(`Successfully added ${creditsAdded} credits!`);
    setSelectedPackage(null);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="pricing-page">
      <Navbar />
      
      <div className="pricing-content">
        <h1>Recharge Credits</h1>
        <p className="pricing-subtitle">Choose a package to continue generating study cards</p>
        
        {success && <div className="success-message">{success}</div>}
        
        <div className="packages-grid">
          {Object.entries(PACKAGES).map(([key, pkg]) => (
            <div key={key} className="package-card">
              <h3>{pkg.name}</h3>
              <div className="package-credits">{pkg.credits} Credits</div>
              <div className="package-price">{pkg.price}</div>
              <ul className="package-features">
                <li>✓ Generate {pkg.credits * 5} cards</li>
                <li>✓ PDF & Text support</li>
                <li>✓ Export to JSON/Text</li>
                <li>✓ AI-powered analysis</li>
              </ul>
              <button 
                onClick={() => setSelectedPackage(key)}
                className="select-btn"
              >
                Select Package
              </button>
            </div>
          ))}
        </div>

        {selectedPackage && (
          <div className="checkout-modal">
            <div className="modal-content">
              <button 
                className="close-btn" 
                onClick={() => setSelectedPackage(null)}
              >
                ×
              </button>
              <h2>Checkout</h2>
              <div className="checkout-info">
                <p><strong>Package:</strong> {PACKAGES[selectedPackage].name}</p>
                <p><strong>Credits:</strong> {PACKAGES[selectedPackage].credits}</p>
                <p><strong>Total:</strong> {PACKAGES[selectedPackage].price}</p>
              </div>
              
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  packageName={selectedPackage}
                  packageInfo={PACKAGES[selectedPackage]}
                  onSuccess={handleSuccess}
                />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Pricing;
