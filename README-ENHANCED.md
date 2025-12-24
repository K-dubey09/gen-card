# 📚 Card Maker - Enhanced Edition

> AI-Powered Study Card Generator with MongoDB, Full-Screen UI, and Advanced Features

## 🆕 What's New

### Enhanced UI/UX
- ✅ **100% Full-Screen Layout** - Maximized workspace utilization
- ✅ **Dark Theme Sidebar** - Modern, professional navigation
- ✅ **Responsive Design** - Optimized for all screen sizes
- ✅ **Smooth Animations** - Enhanced user experience

### New Features
- ✅ **Session Management** - Save and organize your card generation sessions
- ✅ **Document Library** - Upload and manage your study documents
- ✅ **Search Functionality** - Quickly find saved sessions and cards
- ✅ **Favorites System** - Mark important sessions
- ✅ **View Counter** - Track session usage
- ✅ **Tags System** - Organize sessions with custom tags

### Backend Improvements
- ✅ **MongoDB Integration** - Scalable NoSQL database
- ✅ **RESTful API** - Clean, organized endpoints
- ✅ **Session Persistence** - Never lose your work
- ✅ **File Upload System** - Permanent document storage
- ✅ **Better Error Handling** - Improved reliability

### AI Enhancements
- ✅ **AI-Generated Images** - Using DALL-E 3 or Pollinations.ai
- ✅ **Custom Image Prompts** - Context-aware image generation
- ✅ **Roadmap Images** - Visual learning path phases
- ✅ **Configurable AI** - Choose between premium or free options

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- MongoDB Community Edition
- OpenAI API Key

### Installation

1. **Install MongoDB** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/community
   - Install and start MongoDB service

2. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd "Project Card maker"
   install-mongodb.bat
   ```

3. **Configure Environment**:
   - Set OpenAI API key in `ai-service/.env`
   - Update MongoDB URI in `backend/.env` (default: localhost)
   - Set Stripe keys in `backend/.env` (optional)

4. **Start Services**:
   ```bash
   start-all.bat
   ```

5. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:5001

## 📁 Project Structure

```
Project Card maker/
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── main.jsx        # Entry point
│   └── package.json
├── backend/                 # Node.js + Express backend
│   ├── config/             # Database configuration
│   ├── models/
│   │   ├── mongodb/        # MongoDB models
│   │   └── index.js        # SQLite models (fallback)
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & validation
│   └── server.js           # Server entry point
├── ai-service/             # Python + Flask AI service
│   ├── app.py              # AI service logic
│   └── requirements.txt
└── uploads/                # Document storage
```

## 🎯 Features Overview

### 1. Study Cards Generation
- **File Upload**: Support for PDF, TXT, DOC, DOCX
- **Text Input**: Direct text paste
- **AI Processing**: GPT-4o-mini powered analysis
- **Smart Cards**: Title, summary, key points, importance ratings
- **Visual Design**: Color-coded categories, emojis, images

### 2. Learning Roadmap
- **AI-Generated Phases**: Structured learning path
- **Dependencies**: Card prerequisites mapping
- **Time Estimates**: Realistic study duration
- **Visual Timeline**: Phase progression with images
- **Learning Tips**: Phase-specific guidance

### 3. Session Management
- **Auto-Save**: Sessions saved to MongoDB
- **Quick Access**: View all past sessions
- **Search**: Find sessions by title, topic, or tags
- **Favorites**: Mark important sessions
- **Statistics**: Track usage and view counts

### 4. Document Library
- **Upload System**: Store documents permanently
- **Metadata**: Add descriptions, tags, categories
- **File Management**: Edit, delete, organize
- **Quick Generation**: Generate cards from saved docs

### 5. Summary View
- **Statistics Dashboard**: Total cards, high priority, categories
- **Card Overview**: All cards with summaries
- **Quick Navigation**: Jump between views

### 6. Coming Soon
- ❓ **Quiz Generation**: Test your knowledge
- 🗄️ **Advanced Database**: Card collections and folders
- 📊 **Analytics**: Study patterns and progress tracking
- 🏆 **Achievements**: Gamification elements

## 🔧 Configuration

### Database Options

**MongoDB (Recommended)**:
```env
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/cardmaker
```

**SQLite (Fallback)**:
```env
DB_TYPE=sqlite
```

### AI Image Generation

**DALL-E 3 (Premium)**:
```env
USE_DALLE=true
```

**Pollinations.ai (Free)**:
```env
USE_DALLE=false
```

## 📡 API Endpoints

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `PATCH /api/sessions/:id/favorite` - Toggle favorite
- `GET /api/sessions/search/:query` - Search sessions

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update metadata
- `DELETE /api/documents/:id` - Delete document

### Cards (Existing)
- `POST /api/cards/generate-from-file` - Generate from file
- `POST /api/cards/generate-from-text` - Generate from text

### Roadmap (Existing)
- `POST /api/roadmap/generate` - Generate learning roadmap

## 🎨 Theme Customization

The application now features a modern dark sidebar with customizable themes:

- **Sidebar**: Dark gradient background
- **Main Content**: Light background for readability
- **Cards**: Colorful gradients (8 color schemes)
- **Animations**: Smooth transitions throughout

## 📊 Performance

- **Full-Screen Optimized**: Uses 100% viewport
- **Lazy Loading**: Images load on demand
- **Efficient Rendering**: React optimization
- **Database Indexing**: Fast MongoDB queries
- **Caching**: Session data caching

## 🔒 Security

- **Session Authentication**: Secure user sessions
- **Password Hashing**: bcrypt encryption
- **CORS Protection**: Configured origins
- **File Validation**: Type and size checks
- **SQL Injection Protection**: Mongoose sanitization

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
net start MongoDB

# Verify connection
mongo --eval "db.version()"
```

### Port Conflicts
- Frontend: 5173
- Backend: 5000
- AI Service: 5001
- MongoDB: 27017

### Image Generation Slow
- Switch to Pollinations.ai (free, faster)
- Set `USE_DALLE=false` in `ai-service/.env`

## 📝 Development

### Add New Features
1. Create MongoDB model in `backend/models/mongodb/`
2. Create route in `backend/routes/`
3. Add to `server.js`
4. Create frontend component
5. Update Dashboard view

### Database Migration
```bash
# Export from SQLite
node scripts/export-sqlite.js

# Import to MongoDB
node scripts/import-mongodb.js
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **OpenAI**: GPT-4o-mini & DALL-E 3
- **Pollinations.ai**: Free AI image generation
- **MongoDB**: Database solution
- **React**: Frontend framework
- **Express**: Backend framework
- **Flask**: AI service framework

## 📞 Support

For issues or questions:
- Open GitHub issue
- Check documentation
- Review troubleshooting section

---

**Made with ❤️ for better learning experiences**
