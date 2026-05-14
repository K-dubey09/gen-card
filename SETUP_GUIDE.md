# 📚 Card Maker - Complete Setup Guide

A full-featured card maker with **authentication, payment system, and credit management** using OpenAI API.

## ✨ New Features

- 🔐 **User Authentication**: Login, Register, Session management
- 💳 **Payment Integration**: Stripe payment gateway
- 💎 **Credit System**: Buy credits, track usage
- 📊 **Transaction History**: View all purchases and usage
- 🎁 **Welcome Bonus**: 10 free credits on signup
- 🔒 **Secure**: Password hashing, session management

## 🚀 Quick Start

### 1. Install Dependencies

```cmd
cd "e:\PROJECTS\Project Card maker"
pip install -r requirements.txt
```

### 2. Set Up Stripe Account (For Payments)

1. Go to https://stripe.com and create account
2. Get your test API keys from https://dashboard.stripe.com/test/apikeys
3. Update keys in `.env` file

### 3. Configure Environment Variables

The `.env` file is already created with your OpenAI API key. Update the Stripe keys:

```env
OPENAI_API_KEY="your openai api key here"
SECRET_KEY=your-random-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Note:** Update the publishable key in `templates/pricing.html` line 147

### 4. Run the Application

```cmd
python app.py
```

Visit: **http://localhost:5000**

## 📖 User Guide

### First Time Users

1. **Register**: Create account → Get 10 free credits
2. **Dashboard**: Upload file or paste text
3. **Generate**: Create cards (1 credit = 5 cards)
4. **Buy More**: Visit pricing page when needed

### Credit Packages

| Package  | Credits | Price  | Cards  |
|----------|---------|--------|--------|
| Starter  | 50      | $4.99  | 250    |
| Basic    | 100     | $8.99  | 500    |
| Pro      | 250     | $19.99 | 1,250  |
| Premium  | 500     | $34.99 | 2,500  |

### Pages & Features

**🏠 Dashboard** (`/dashboard`)
- Upload PDF/TXT files
- Paste text directly
- See credit balance
- Generate cards with AI

**💳 Pricing** (`/pricing`)
- View credit packages
- Secure Stripe checkout
- Instant credit delivery

**📊 Transactions** (`/transactions`)
- View purchase history
- Track credit usage
- See all transactions

## 🛠️ Technical Details

### Database Schema

**Users Table**
- id, username, email, password_hash
- credits (default: 10)
- created_at

**Transactions Table**
- id, user_id, type, amount
- description, payment_id
- created_at

**CardGenerations Table**
- id, user_id, cards_generated
- credits_used, file_name
- created_at

### Credit System

- **Earn Credits**: Purchase packages or welcome bonus
- **Use Credits**: 1 credit = 5 cards generated
- **Track Usage**: All transactions logged
- **No Expiration**: Credits never expire

### AI Model

- **Model**: GPT-4o-mini (OpenAI)
- **Purpose**: Extract key information, generate concise cards
- **Processing**: Smart chunking for large documents
- **Output**: JSON-formatted cards with categories and importance

## 🔐 Security Features

1. **Password Hashing**: Werkzeug security
2. **Session Management**: Flask sessions with secret key
3. **Login Required**: Protected routes with decorator
4. **SQL Injection**: SQLAlchemy ORM protection
5. **Secure Payments**: Stripe PCI-compliant

## 💳 Payment Flow

1. User selects package → Click "Buy Now"
2. Stripe Payment Intent created
3. User enters payment info
4. Payment confirmed with Stripe
5. Credits added to account
6. Transaction recorded

## 🎨 Pages Overview

### Public Pages
- `/login` - User login
- `/register` - New user registration

### Protected Pages (Login Required)
- `/dashboard` - Main app interface
- `/pricing` - Buy credits
- `/transactions` - Transaction history
- `/api/user-info` - Get user data (API)

## 📊 API Endpoints

### Authentication
- `POST /register` - Create account
- `POST /login` - Login user
- `GET /logout` - Logout user

### Card Generation
- `POST /upload` - Upload file and generate cards
- `POST /generate-from-text` - Generate from text input

### Payments
- `POST /create-payment-intent` - Initialize payment
- `POST /confirm-payment` - Confirm and add credits

## 🧪 Testing

### Test with Demo Data

1. **Register**: Create test account
2. **Use Free Credits**: Generate 2 sets (10 credits = 50 cards)
3. **Test Payment**: Use Stripe test card: `4242 4242 4242 4242`
4. **View History**: Check transactions page

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0027 6000 3184
```

Any future date, any CVC, any ZIP

## 🐛 Troubleshooting

**Database Issues:**
```cmd
# Reset database
del cardmaker.db
python app.py
```

**Stripe Errors:**
- Verify API keys are correct
- Check Stripe dashboard for logs
- Use test mode keys for development

**OpenAI Errors:**
- Verify API key is active
- Check API usage limits
- Monitor OpenAI dashboard

**Session Issues:**
- Clear browser cookies
- Check SECRET_KEY in .env
- Restart Flask server

## 📁 Project Structure

```
Project Card maker/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (SECRET!)
├── cardmaker.db               # SQLite database (auto-created)
├── templates/
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── dashboard.html         # Main app interface
│   ├── pricing.html           # Credit packages
│   └── transactions.html      # Transaction history
├── static/
│   ├── style.css              # Main styles
│   ├── auth.css               # Authentication styles
│   └── script.js              # Frontend logic
└── uploads/                   # Temporary file storage
```

## 🔧 Configuration Options

**In `app.py`:**

```python
# Credit calculation
CREDIT_PER_CARDS = 5  # 1 credit = 5 cards

# Package pricing
CREDIT_PACKAGES = {
    'starter': {'credits': 50, 'price': 499},
    # Add more packages...
}

# AI model settings
model="gpt-4o-mini"
temperature=0.7
max_tokens=2000
```

## 💡 Tips for Production

1. **Change SECRET_KEY**: Generate strong random key
2. **Use Production Stripe Keys**: Switch from test to live
3. **Enable HTTPS**: Required for secure payments
4. **Add Rate Limiting**: Prevent abuse
5. **Database Backup**: Regular backups of cardmaker.db
6. **Monitor API Usage**: Track OpenAI costs
7. **Email Verification**: Add email confirmation
8. **Password Reset**: Implement forgot password

## 🌟 Future Enhancements

- [ ] Email notifications for purchases
- [ ] Card saving and collections
- [ ] Share cards with others
- [ ] Mobile app
- [ ] Bulk discount packages
- [ ] Referral rewards
- [ ] Advanced card filtering
- [ ] Export to Anki format

## 📈 Cost Estimation

**OpenAI API Usage:**
- ~$0.01 per 10 cards (GPT-4o-mini)
- Monthly: 1000 cards ≈ $1

**Stripe Fees:**
- 2.9% + $0.30 per transaction
- $4.99 purchase = $0.44 fee

**Hosting (if deployed):**
- Heroku/Railway: Free to $7/month
- Database: Included or $5-10/month

## 🤝 Support

**Common Issues:**

1. **"Insufficient credits"** → Go to `/pricing` to buy more
2. **"Login required"** → Register or login first
3. **"Payment failed"** → Check card details, try again

**Need Help?**
- Check error messages in terminal
- Review Stripe dashboard logs
- Verify all API keys are correct

## 📝 License

Open source for educational purposes.

## 🎯 Key Features Summary

✅ Complete authentication system
✅ Stripe payment integration  
✅ Credit-based usage system
✅ OpenAI GPT-4o-mini integration
✅ PDF & text file support
✅ Transaction history tracking
✅ Responsive modern UI
✅ Secure password handling
✅ Session management
✅ Export cards (JSON/Text)
✅ Print functionality
✅ Card filtering by priority

---

**🎉 You're all set! Register an account and start creating study cards!**

**Quick Start:**
```cmd
python app.py
```
Then visit http://localhost:5000 and register!
