# 🎨 Card Maker - Visual User Guide

## 🗺️ Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    LANDING PAGE                              │
│                  http://localhost:5000                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐         ┌─────▼─────┐
         │  NEW USER?  │         │  EXISTING │
         │   REGISTER  │         │   LOGIN   │
         └──────┬──────┘         └─────┬─────┘
                │                       │
                ├───────────────────────┤
                │                       │
         Enter Details           Enter Credentials
         - Username              - Username
         - Email                 - Password
         - Password              
                │                       │
                └───────────┬───────────┘
                            │
                   ✅ AUTHENTICATED
                            │
                ┌───────────▼────────────┐
                │   🏠 DASHBOARD         │
                │                        │
                │  💎 10 Credits         │
                │  (New User Bonus)      │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌──────▼──────┐     ┌─────▼──────┐
   │  UPLOAD  │      │    PASTE    │     │    BUY     │
   │   FILE   │      │    TEXT     │     │  CREDITS   │
   └────┬─────┘      └──────┬──────┘     └─────┬──────┘
        │                   │                   │
        └──────────┬────────┘                   │
                   │                            │
         ┌─────────▼──────────┐                 │
         │ SELECT NUMBER OF   │                 │
         │ CARDS (5-50)       │                 │
         │                    │                 │
         │ Credits needed: 2  │                 │
         └─────────┬──────────┘                 │
                   │                            │
          ┌────────▼─────────┐                  │
          │ CHECK CREDITS    │                  │
          │ Sufficient? ✓    │                  │
          └────────┬─────────┘                  │
                   │                            │
           ┌───────▼────────┐                   │
           │  AI GENERATION │                   │
           │  GPT-4o-mini   │                   │
           └───────┬────────┘                   │
                   │                            │
         ┌─────────▼──────────┐                 │
         │  10 CARDS CREATED  │                 │
         │  Credits: 10 → 8   │                 │
         └─────────┬──────────┘                 │
                   │                            │
         ┌─────────▼──────────┐                 │
         │  VIEW CARDS        │                 │
         │  - Filter          │                 │
         │  - Export          │                 │
         │  - Print           │                 │
         └────────────────────┘                 │
                                                │
                             ┌──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  PRICING PAGE    │
                    │                  │
                    │  Choose Package: │
                    │  • Starter $4.99 │
                    │  • Basic $8.99   │
                    │  • Pro $19.99    │
                    │  • Premium $34.99│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  STRIPE CHECKOUT │
                    │                  │
                    │  Enter Card Info │
                    │  Test: 4242...   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  PAYMENT SUCCESS │
                    │  Credits Added!  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  BACK TO         │
                    │  DASHBOARD       │
                    │  More Credits!   │
                    └──────────────────┘
```

## 📱 Page Layouts

### 1. Login Page
```
┌─────────────────────────────────┐
│         📚 CARD MAKER           │
│                                 │
│      Welcome Back               │
│      Login to continue          │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Username                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       LOGIN             │   │
│  └─────────────────────────┘   │
│                                 │
│  Don't have account? Sign up    │
└─────────────────────────────────┘
```

### 2. Register Page
```
┌─────────────────────────────────┐
│         📚 CARD MAKER           │
│                                 │
│      Create Account             │
│      Get 10 free credits!       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Username                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Confirm Password        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   CREATE ACCOUNT        │   │
│  └─────────────────────────┘   │
│                                 │
│  Already have account? Login    │
└─────────────────────────────────┘
```

### 3. Dashboard
```
┌─────────────────────────────────────────────────────┐
│ 📚 Card Maker    💎 10 Credits  💳  📊  🚪 Logout  │
├─────────────────────────────────────────────────────┤
│                                                     │
│           Welcome, JohnDoe! 👋                     │
│       Transform books into study cards             │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  📄 Upload File     ✍️ Paste Text          │  │
│  ├─────────────────────────────────────────────┤  │
│  │                                             │  │
│  │         📤 UPLOAD YOUR DOCUMENT             │  │
│  │         Supports PDF and TXT                │  │
│  │                                             │  │
│  │         [Choose File]                       │  │
│  │                                             │  │
│  │   Number of cards: 10 (Credits: 2)         │  │
│  │   ─────────────────                        │  │
│  │                                             │  │
│  │   ┌───────────────────────────────────┐   │  │
│  │   │    Generate Cards ✨              │   │  │
│  │   └───────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         YOUR STUDY CARDS (10)               │  │
│  │  💾 Export  📝 Export  🖨️ Print            │  │
│  ├─────────────────────────────────────────────┤  │
│  │  Filter: [All Cards ▼]                      │  │
│  ├─────────────────────────────────────────────┤  │
│  │                                             │  │
│  │  ┌────────────┐  ┌────────────┐            │  │
│  │  │ Card 1     │  │ Card 2     │            │  │
│  │  │ Biology    │  │ Chemistry  │            │  │
│  │  │ HIGH       │  │ MEDIUM     │            │  │
│  │  │            │  │            │            │  │
│  │  │ Key facts  │  │ Key facts  │            │  │
│  │  └────────────┘  └────────────┘            │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4. Pricing Page
```
┌─────────────────────────────────────────────────────┐
│ 📚 Card Maker    💎 8 Credits   🏠  📊  🚪 Logout  │
├─────────────────────────────────────────────────────┤
│                                                     │
│              💳 Buy Credits                        │
│       Choose a package that fits your needs        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ STARTER  │  │ ⭐ BASIC │  │   PRO    │        │
│  │          │  │ POPULAR  │  │          │        │
│  │  $4.99   │  │  $8.99   │  │  $19.99  │        │
│  │          │  │          │  │          │        │
│  │ 50 Credits│ │100 Credits│ │250 Credits│       │
│  │ 250 cards│  │ 500 cards│  │1250 cards│        │
│  │          │  │          │  │          │        │
│  │ [Buy Now]│  │ [Buy Now]│  │ [Buy Now]│        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│  💡 1 credit = 5 cards generated                   │
│  🔒 Secure payment powered by Stripe               │
└─────────────────────────────────────────────────────┘
```

### 5. Transaction History
```
┌─────────────────────────────────────────────────────┐
│ 📚 Card Maker    💎 108 Credits  🏠  💳  🚪        │
├─────────────────────────────────────────────────────┤
│                                                     │
│           📊 Transaction History                   │
│        View all your credit transactions           │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Date        Type      Description   Credits │  │
│  ├─────────────────────────────────────────────┤  │
│  │ 2025-11-30  BONUS    Welcome bonus    +10   │  │
│  │ 2025-11-30  USAGE    10 cards gen.    -2    │  │
│  │ 2025-11-30  PURCHASE Basic package   +100   │  │
│  │ 2025-11-30  USAGE    20 cards gen.    -4    │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🎯 User Actions Flow

### New User Journey
```
1. Visit site → Redirected to /login
2. Click "Sign up" → /register
3. Fill form (username, email, password)
4. Submit → Account created
5. Auto-login → Redirected to /dashboard
6. See "💎 10 Credits" in navbar
7. Upload file or paste text
8. Generate cards (uses 2 credits)
9. View cards, filter, export
10. Need more? Click "💳 Buy Credits"
```

### Returning User Journey
```
1. Visit site → Redirected to /login
2. Enter credentials
3. Click Login → Authenticated
4. Redirected to /dashboard
5. See credit balance
6. Generate more cards
7. View transaction history
8. Buy more credits when needed
```

### Payment Journey
```
1. Click "💳 Buy Credits" → /pricing
2. Choose package (e.g., Basic $8.99)
3. Click "Buy Now"
4. Stripe modal appears
5. Enter card: 4242 4242 4242 4242
6. Enter expiry: 12/34
7. Enter CVC: 123
8. Submit payment
9. Credits added instantly
10. Redirected to dashboard
11. See updated credit balance
```

## 🎨 Color Scheme

```
Primary:    #6366f1 (Indigo)     [Buttons, highlights]
Secondary:  #8b5cf6 (Purple)     [Gradients]
Success:    #10b981 (Green)      [Positive actions]
Danger:     #ef4444 (Red)        [Errors, usage]
Warning:    #f59e0b (Orange)     [Medium priority]
Background: #f8fafc (Light blue) [Page background]
Text:       #1e293b (Dark)       [Primary text]
```

## 📊 Card Priority Colors

```
┌─────────────┬──────────┬─────────────────┐
│  Priority   │  Color   │  Badge Color    │
├─────────────┼──────────┼─────────────────┤
│    HIGH     │   Red    │  Red on pink    │
│   MEDIUM    │  Orange  │  Orange on gold │
│    LOW      │  Green   │  Green on mint  │
└─────────────┴──────────┴─────────────────┘
```

## 🔔 Notification Types

```
✅ SUCCESS: Green background
   "Generated 10 cards! Used 2 credits."

❌ ERROR: Red background
   "Insufficient credits. Need 2, have 0."

ℹ️ INFO: Blue background
   "Payment processing..."

⚠️ WARNING: Orange background
   "File size limit: 50MB"
```

## 📱 Responsive Design

### Desktop (1200px+)
```
Navbar: Full width with all links
Cards: 3 columns grid
Sidebar: Visible
Pricing: 4 columns
```

### Tablet (768px - 1199px)
```
Navbar: Compact with icons
Cards: 2 columns grid
Sidebar: Collapsible
Pricing: 2 columns
```

### Mobile (< 768px)
```
Navbar: Hamburger menu
Cards: 1 column grid
Sidebar: Hidden
Pricing: 1 column
```

## 🎭 User States

### Not Logged In
```
✅ Can view: /login, /register
❌ Cannot view: /dashboard, /pricing, /transactions
→ Redirected to: /login
```

### Logged In (Has Credits)
```
✅ Can view: All pages
✅ Can generate: Cards (within credit limit)
✅ Can purchase: More credits
✅ Can export: Generated cards
```

### Logged In (No Credits)
```
✅ Can view: All pages
❌ Cannot generate: Cards
→ Prompted to: Buy more credits
✅ Can view: Past generated cards
```

## 🎯 Success Metrics

### User Engagement
- Registration rate
- Cards generated per user
- Average credit purchase
- Return user rate

### Revenue Metrics
- Total purchases
- Average order value
- Conversion rate
- Customer lifetime value

## 🚀 Quick Reference

### Test Accounts
```
Username: testuser
Email: test@example.com
Password: test123
```

### Test Cards (Stripe)
```
Success:  4242 4242 4242 4242
Declined: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Credit Calculations
```
5 cards  = 1 credit  = $0.10 - $0.18
10 cards = 2 credits = $0.20 - $0.36
25 cards = 5 credits = $0.50 - $0.90
50 cards = 10 credits = $1.00 - $1.80
```

---

**🎨 Beautiful, Intuitive, Powerful - Start Creating Cards Today!**
