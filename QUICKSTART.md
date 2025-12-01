# 🚀 QUICK START - Card Maker

## ⚡ 3-Minute Setup

### 1️⃣ Install (30 seconds)
```cmd
pip install flask flask-sqlalchemy openai PyPDF2 stripe
```

### 2️⃣ Get Stripe Keys (2 minutes)
1. Visit: https://stripe.com → Sign up
2. Go to: https://dashboard.stripe.com/test/apikeys
3. Copy both keys

### 3️⃣ Update 2 Files (30 seconds)

**File 1: `.env`** (line 8-9)
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

**File 2: `templates/pricing.html`** (line 147)
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
```

### 4️⃣ Run (5 seconds)
```cmd
python app.py
```

### 5️⃣ Open Browser
http://localhost:5000

---

## 🎯 What You Get

✅ User authentication (login/register)
✅ 10 free credits on signup
✅ AI card generation (GPT-4o-mini)
✅ Stripe payments (4 packages)
✅ Transaction history
✅ Export cards (JSON/Text)
✅ Beautiful modern UI

---

## 💳 Test Payment

Card: `4242 4242 4242 4242`
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

---

## 📊 Quick Reference

**Credit Packages:**
- Starter: $4.99 → 50 credits (250 cards)
- Basic: $8.99 → 100 credits (500 cards)
- Pro: $19.99 → 250 credits (1,250 cards)
- Premium: $34.99 → 500 credits (2,500 cards)

**Credit System:**
- 1 credit = 5 cards
- New users get 10 free credits
- Credits never expire

**File Support:**
- PDF files (up to 50MB)
- TXT files (up to 50MB)
- Minimum text: 100 characters

---

## 🔑 Important Files

**Already Configured:**
- ✅ OpenAI API key (in `.env` and `app.py`)
- ✅ Database models
- ✅ Authentication system
- ✅ UI templates

**You Need to Add:**
- ⚠️ Stripe Secret Key (in `.env`)
- ⚠️ Stripe Publishable Key (in `.env` and `pricing.html`)

---

## 🎮 First Use

1. **Register**: Create account → Get 10 free credits
2. **Generate**: Paste text → Generate 10 cards (use 2 credits)
3. **Export**: Download as JSON or text
4. **Buy More**: When credits run out

---

## 🐛 Quick Fixes

**"Module not found"**
```cmd
pip install -r requirements.txt
```

**"Database error"**
```cmd
del cardmaker.db && python app.py
```

**"Payment error"**
- Check Stripe keys are correct
- Make sure using test keys (sk_test_, pk_test_)

**"OpenAI error"**
- API key already configured ✅
- Check internet connection

---

## 📁 Key Files

```
app.py           # Backend (400+ lines)
.env             # API keys (SECRET!)
cardmaker.db     # Database (auto-created)

templates/
  login.html     # Login page
  register.html  # Registration
  dashboard.html # Main app
  pricing.html   # Buy credits
  transactions.html # History

static/
  style.css      # Main styles
  auth.css       # Auth styles
  script.js      # Frontend logic
```

---

## 🎯 Success Checklist

- [✅] Dependencies installed
- [✅] OpenAI configured (already done!)
- [⚠️] Stripe keys added
- [⚠️] Run `python app.py`
- [⚠️] Test registration
- [⚠️] Test card generation
- [⚠️] Test payment (with test card)

---

## 💡 Pro Tips

1. **Start Simple**: Register → Use free credits first
2. **Test Payments**: Use Stripe test card before going live
3. **Export Often**: Save your cards as JSON backup
4. **Check History**: Review transactions page regularly
5. **Buy in Bulk**: Premium package = best value

---

## 🌐 URLs

**Main App:**
- http://localhost:5000 → Login/Register
- http://localhost:5000/dashboard → Main app
- http://localhost:5000/pricing → Buy credits
- http://localhost:5000/transactions → History

**External:**
- https://stripe.com → Get API keys
- https://platform.openai.com → Check OpenAI usage

---

## 📞 Support

**Documentation:**
- README.md → Overview
- INSTALL.md → Quick install
- SETUP_GUIDE.md → Detailed guide
- CHECKLIST.md → Testing checklist

**Common Issues:**
- Check terminal for errors
- Check browser console
- Verify API keys are correct
- Restart app after changes

---

## 🎉 You're Ready!

**Just 2 steps remaining:**
1. Add your Stripe keys
2. Run `python app.py`

Then visit http://localhost:5000 and start creating cards! 🚀

---

**OpenAI API Key: ✅ Already Configured**
**Database: ✅ Auto-created on first run**
**Authentication: ✅ Ready to use**
**Payment: ⚠️ Add your Stripe keys**

---

## 🔥 Quick Commands

```cmd
# Install
pip install -r requirements.txt

# Run
python app.py

# Reset database
del cardmaker.db

# Check modules
python -c "import flask, openai, stripe; print('OK')"
```

---

**Need help? Check CHECKLIST.md for detailed testing!**
