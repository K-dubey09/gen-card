# 📚 Card Maker - Modern Stack Architecture

## 🎯 Project Overview
AI-powered study card generator with React frontend, Node.js backend, and Python AI microservice.

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 5173)
│   (Vite + React)│
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Node.js Backend│ (Port 5000)
│ (Express + DB)  │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│ Python AI Service│ (Port 5001)
│  (OpenAI API)   │
└─────────────────┘
```

## 📁 Project Structure

```
Project Card maker/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # Navbar, CardGrid
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Login, Register, Dashboard, Pricing, Transactions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env              # Frontend environment variables
│   └── package.json
│
├── backend/              # Node.js + Express server
│   ├── routes/           # auth, cards, payment, user
│   ├── models/           # Sequelize models (User, Transaction, CardGeneration)
│   ├── middleware/       # Authentication middleware
│   ├── server.js
│   ├── .env             # Backend environment variables
│   └── package.json
│
├── ai-service/          # Python microservice
│   ├── app.py           # Flask app with OpenAI integration
│   ├── requirements.txt
│   └── .env            # OpenAI API key
│
├── start-all.bat       # Start all services at once
└── install.bat         # Install all dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
install.bat
```

### 2. Configure Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:5001/generate-cards
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

#### AI Service (.env)
```env
OPENAI_API_KEY=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
```

### 3. Start All Services
```bash
start-all.bat
```

This will start:
- **Frontend** → http://localhost:5173
- **Backend** → http://localhost:5000
- **AI Service** → http://localhost:5001

## 🔑 Features

### ✅ Authentication
- User registration with email validation
- Secure login with session management
- Password hashing with bcrypt
- Protected routes

### 💳 Credit System
- 10 free credits on signup
- 1 credit = 5 cards generated
- Multiple pricing packages

### 🤖 AI Card Generation
- Upload PDF or text files
- Paste text directly
- AI-powered content analysis
- Smart categorization
- Importance levels (1-5 stars)

### 💰 Payment Integration
- Stripe payment gateway
- 4 pricing packages:
  - Starter: $4.99 (50 credits)
  - Basic: $8.99 (100 credits)
  - Pro: $19.99 (250 credits)
  - Premium: $34.99 (500 credits)

### 📊 Card Management
- Filter by importance
- Export to JSON/Text
- Print-ready layout
- Transaction history

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Payments**: Stripe React Elements
- **Styling**: CSS Modules

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: express-session + bcrypt
- **Payment**: Stripe API
- **Security**: helmet, cors

### AI Service
- **Language**: Python 3
- **Framework**: Flask
- **AI**: OpenAI GPT-4o-mini
- **PDF Processing**: PyPDF2
- **CORS**: flask-cors

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check auth status

### Cards
- `POST /api/cards/generate-from-file` - Generate from PDF/TXT
- `POST /api/cards/generate-from-text` - Generate from text

### Payment
- `GET /api/payment/packages` - Get pricing packages
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `POST /api/payment/confirm` - Confirm payment

### User
- `GET /api/user/info` - Get user profile
- `GET /api/user/transactions` - Get transaction history

### AI Service
- `POST /generate-cards` - Generate cards with AI

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- Session-based authentication
- CORS protection
- Helmet security headers
- Environment variable protection
- SQL injection prevention (Sequelize ORM)

## 📝 Database Schema

### Users Table
```sql
id, username, email, password, credits, createdAt, updatedAt
```

### Transactions Table
```sql
id, userId, type, amount, description, paymentId, createdAt, updatedAt
```

### CardGenerations Table
```sql
id, userId, cardsGenerated, creditsUsed, fileName, createdAt, updatedAt
```

## 🧪 Testing

### Manual Testing Steps
1. Register a new account
2. Verify 10 free credits
3. Upload a PDF or paste text
4. Generate cards (uses credits)
5. Filter by importance
6. Export cards (JSON/Text)
7. Purchase credits via Stripe
8. Check transaction history

## 🚨 Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify Node.js is installed: `node --version`
- Run `npm install` in backend folder

### AI Service errors
- Verify OpenAI API key is correct
- Check Python version: `python --version`
- Install dependencies: `pip install -r requirements.txt`

### Frontend issues
- Clear browser cache
- Check if backend is running
- Verify `.env` has correct API_URL

### Payment not working
- Ensure Stripe keys are set in both backend and frontend `.env`
- Use test card: 4242 4242 4242 4242 (any future date, any CVC)

## 📦 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set environment variable: `VITE_API_URL`

### Backend (Heroku/Railway)
1. Set environment variables
2. Deploy from `backend/` folder

### AI Service (Python Anywhere/Railway)
1. Install Python dependencies
2. Set `OPENAI_API_KEY`
3. Run `app.py`

## 📄 License
MIT License

## 👥 Support
For issues or questions, please contact support.

---

**Built with ❤️ using React, Node.js, Python, and OpenAI**
