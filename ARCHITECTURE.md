# Card Maker - System Architecture

## 🏗️ System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐         ┌─────▼─────┐
         │   Register  │         │   Login   │
         │ (+10 free)  │         │           │
         └──────┬──────┘         └─────┬─────┘
                │                       │
                └───────────┬───────────┘
                            │
                    ┌───────▼────────┐
                    │   DASHBOARD    │
                    │  (Protected)   │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Upload File   │  │ Paste Text  │  │  Buy Credits    │
│   (PDF/TXT)    │  │             │  │   (Stripe)      │
└───────┬────────┘  └──────┬──────┘  └────────┬────────┘
        │                   │                   │
        └──────────┬────────┘                   │
                   │                            │
         ┌─────────▼──────────┐                 │
         │  Check Credits     │                 │
         │  (1 credit = 5     │                 │
         │    cards)          │                 │
         └─────────┬──────────┘                 │
                   │                            │
           ┌───────▼───────┐                    │
           │  Sufficient?  │                    │
           └───┬───────┬───┘                    │
               │       │                        │
             YES      NO                        │
               │       │                        │
               │       └────────────────────────┘
               │
    ┌──────────▼──────────┐
    │   OpenAI GPT-4o     │
    │   Extract Key Info  │
    │   Generate Cards    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Deduct Credits     │
    │  Record Transaction │
    │  Save to Database   │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Display Cards     │
    │   - Filter          │
    │   - Export          │
    │   - Print           │
    └─────────────────────┘
```

## 💾 Database Schema

```
┌────────────────────┐
│       USER         │
├────────────────────┤
│ id (PK)            │
│ username (unique)  │
│ email (unique)     │
│ password_hash      │
│ credits (default:10)│
│ created_at         │
└────────┬───────────┘
         │
         │ 1:Many
         │
┌────────▼───────────┐      ┌─────────────────────┐
│   TRANSACTION      │      │  CARD_GENERATION    │
├────────────────────┤      ├─────────────────────┤
│ id (PK)            │      │ id (PK)             │
│ user_id (FK)       │      │ user_id (FK)        │
│ type               │      │ cards_generated     │
│ amount             │      │ credits_used        │
│ description        │      │ file_name           │
│ payment_id         │      │ created_at          │
│ created_at         │      └─────────────────────┘
└────────────────────┘
```

## 🔄 Credit System Flow

```
NEW USER REGISTRATION
        │
        ▼
   +10 Credits (Bonus)
        │
        ▼
   DASHBOARD
        │
    ┌───┴───┐
    │       │
GENERATE  BUY MORE
 CARDS    CREDITS
    │       │
    │    ┌──▼──────────────┐
    │    │ Stripe Payment  │
    │    │ $4.99 - $34.99  │
    │    └──┬──────────────┘
    │       │
    │   ┌───▼────┐
    │   │ +50 to │
    │   │ +500   │
    │   │ Credits│
    │   └───┬────┘
    │       │
    └───┬───┘
        │
   ┌────▼─────┐
   │ Use 1-10 │
   │ Credits  │
   └────┬─────┘
        │
   ┌────▼─────┐
   │ Generate │
   │ 5-50     │
   │ Cards    │
   └──────────┘
```

## 🔐 Authentication Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ POST /register or /login
       │ {username, password}
       │
┌──────▼───────┐
│    Flask     │
│   Backend    │
└──────┬───────┘
       │
       │ Check credentials
       │ Hash password
       │
┌──────▼───────┐
│   SQLite     │
│   Database   │
└──────┬───────┘
       │
       │ User validated
       │
┌──────▼───────┐
│   Create     │
│   Session    │
│   (Cookie)   │
└──────┬───────┘
       │
       │ Redirect to /dashboard
       │
┌──────▼───────┐
│   Protected  │
│   Routes     │
│   Available  │
└──────────────┘
```

## 💳 Payment Flow

```
USER CLICKS "BUY NOW"
        │
        ▼
CREATE PAYMENT INTENT
  (Stripe API Call)
        │
        ▼
DISPLAY PAYMENT FORM
  (Stripe Elements)
        │
USER ENTERS CARD INFO
        │
        ▼
CONFIRM PAYMENT
  (Stripe.js)
        │
        ▼
PAYMENT SUCCESSFUL?
        │
    ┌───┴───┐
   YES      NO
    │        │
    │    SHOW ERROR
    │        │
    ▼        ▼
ADD CREDITS  RETRY
    │
RECORD TRANSACTION
    │
    ▼
UPDATE USER BALANCE
    │
    ▼
REDIRECT TO DASHBOARD
```

## 🤖 AI Card Generation

```
USER INPUT
(File or Text)
     │
     ▼
EXTRACT TEXT
  (PyPDF2)
     │
     ▼
CHUNK TEXT
(6000 chars)
     │
     ▼
PROCESS CHUNKS
     │
     ▼
┌────────────────────┐
│   OpenAI API       │
│   GPT-4o-mini      │
│                    │
│ Analyze → Extract  │
│ Key Info → Format  │
└────────┬───────────┘
         │
         ▼
    JSON CARDS
    [
      {
        title: "...",
        content: "...",
        category: "...",
        importance: "..."
      }
    ]
         │
         ▼
   DISPLAY TO USER
```

## 📊 Technology Stack

```
┌─────────────────────────────────────┐
│           FRONTEND                  │
├─────────────────────────────────────┤
│ • HTML5 / CSS3                      │
│ • Vanilla JavaScript                │
│ • Stripe Elements (Payment UI)      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│           BACKEND                   │
├─────────────────────────────────────┤
│ • Python 3.8+                       │
│ • Flask (Web Framework)             │
│ • Flask-SQLAlchemy (ORM)            │
│ • Werkzeug (Security)               │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│          DATABASE                   │
├─────────────────────────────────────┤
│ • SQLite (Development)              │
│ • PostgreSQL (Production Ready)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        EXTERNAL APIs                │
├─────────────────────────────────────┤
│ • OpenAI API (GPT-4o-mini)          │
│ • Stripe API (Payments)             │
└─────────────────────────────────────┘
```

## 🎯 Key Components

### Backend (app.py)
- Authentication routes
- Card generation logic
- Payment processing
- Database operations
- Session management

### Frontend
- **login.html** - User login
- **register.html** - User registration
- **dashboard.html** - Main interface
- **pricing.html** - Credit packages
- **transactions.html** - History view

### Styles
- **style.css** - Main application styles
- **auth.css** - Authentication pages

### Scripts
- **script.js** - Card generation, filters, export

## 🔒 Security Measures

1. **Password Security**
   - Hashed with Werkzeug
   - Never stored in plaintext
   - Secure comparison

2. **Session Security**
   - Secret key encryption
   - HTTP-only cookies
   - CSRF protection ready

3. **Payment Security**
   - Stripe PCI compliance
   - No card data stored
   - Server-side validation

4. **API Security**
   - Environment variables
   - Rate limiting ready
   - Protected routes

5. **Database Security**
   - SQLAlchemy ORM
   - SQL injection prevention
   - Parameterized queries

## 📈 Scalability Considerations

### Current (Development)
- SQLite database
- Single server instance
- Local file storage

### Production Ready
- PostgreSQL/MySQL
- Load balancer
- Redis for sessions
- Cloud storage (S3)
- CDN for static files
- Docker containers
- CI/CD pipeline

## 🚀 Deployment Options

1. **Heroku** - Quick deploy, free tier
2. **Railway** - Modern platform, easy setup
3. **AWS** - Full control, scalable
4. **DigitalOcean** - Simple VPS
5. **Vercel** - Serverless option

---

This architecture supports:
- ✅ Scalability to 1000+ users
- ✅ Secure payment processing
- ✅ Fast AI card generation
- ✅ Transaction tracking
- ✅ User management
- ✅ Credit system
