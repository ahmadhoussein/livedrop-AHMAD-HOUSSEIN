# Ahmad Store - Full Stack E-commerce Platform

A modern, full-stack e-commerce platform with AI-powered customer support assistant.

## 🚀 Features

### Frontend (React + TypeScript)
- ⚡ Fast and responsive UI built with React and TypeScript
- 🎨 Modern design with TailwindCSS
- 🛒 Complete shopping cart functionality
- 📦 Real-time order tracking with SSE
- 🔍 Advanced product search and filtering
- 📱 Mobile-responsive design
- 🤖 AI-powered support assistant

### Backend (Node.js + Express + MongoDB)
- 🗄️ MongoDB database with optimized queries
- 🔐 Secure API endpoints with CORS protection
- 📊 Business analytics and dashboard
- 🤖 AI assistant with bilingual support (English/Arabic)
- 📚 Knowledge base with citation validation
- 🔄 Real-time order status updates via SSE
- 🌐 RESTful API architecture

### AI Assistant Features
- 🧠 Intent classification (7 intents)
- 📖 Knowledge base with 17+ policies
- 🌍 Bilingual support (English & Arabic)
- 📝 Citation validation for grounded responses
- 🔗 Function registry for order status, product search
- 🤗 Hugging Face API integration (optional)

## 📁 Project Structure

```
ahmadStore-main/
├── apps/
│   ├── api/                    # Backend API (Node.js + Express)
│   │   ├── src/
│   │   │   ├── assistant/      # AI Assistant engine
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   └── server.js       # Main server
│   │   └── package.json
│   │
│   ├── storefront/             # Frontend (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── lib/            # Utilities & API client
│   │   │   └── assistant/      # Assistant engine (frontend)
│   │   └── package.json
│   │
│   └── ai-assistant/           # Optional LLM service (Python)
│       └── main.py
│
├── docs/                       # Documentation & knowledge base
│   ├── ground-truth.json       # Knowledge base (17 policies)
│   └── prompts.yaml            # Assistant configuration
│
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend Setup

```bash
cd apps/api
npm install

# Create config.env file
cp env.example config.env

# Edit config.env with your MongoDB URI
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ahmadstore
# NODE_ENV=development
# PORT=3001

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### Frontend Setup

```bash
cd apps/storefront
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start development server
npm run dev

# Or build for production
npm run build
```

## 🚀 Deployment

### Backend (Render)

1. **Create Web Service on Render.com**
2. **Configure:**
   - Root Directory: `apps/api`
   - Build Command: `npm ci --only=production`
   - Start Command: `node src/server.js`
   - Environment Variables:
     ```
     NODE_ENV=production
     NODE_VERSION=20
     MONGODB_URI=your_mongodb_connection_string
     CORS_ORIGINS=https://your-frontend-url.com
     AUTO_SEED=true
     ```

See `RENDER_DEPLOYMENT.md` for detailed instructions.

### Frontend (Vercel)

1. **Deploy to Vercel**
2. **Configure:**
   - Root Directory: `apps/storefront`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable:
     ```
     VITE_API_URL=https://your-api-url.onrender.com
     ```

## 📚 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `GET /api/orders/:id/stream` - SSE order status updates

### AI Assistant
- `POST /api/assistant/chat` - Chat with AI assistant
- `GET /api/assistant/info` - Get assistant capabilities
- `GET /api/assistant/search/policies` - Search knowledge base
- `POST /api/assistant/kb/reload` - Reload knowledge base

### Analytics
- `GET /api/dashboard/business-metrics` - Business metrics
- `GET /api/analytics/sales` - Sales analytics

## 🤖 AI Assistant Configuration

The AI assistant supports:

### Intents
1. **policy_question** - Store policies (returns, shipping, warranty)
2. **order_status** - Order tracking
3. **product_search** - Product search
4. **complaint** - Customer complaints
5. **chitchat** - Greetings
6. **off_topic** - Unrelated questions
7. **violation** - Inappropriate content

### Environment Variables (Optional)
```env
# Hugging Face API (for LLM responses)
HUGGINGFACE_TOKEN=hf_your_token_here
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3

# Or use separate LLM service
LLM_ENDPOINT=https://your-llm-service.onrender.com
```

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
npm test
```

### Frontend Tests
```bash
cd apps/storefront
npm test
```

## 📝 Environment Variables

### Backend (`apps/api/config.env`)
```env
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://your-frontend.com
AUTO_SEED=true
HUGGINGFACE_TOKEN=hf_... (optional)
LLM_ENDPOINT=https://... (optional)
```

### Frontend (`apps/storefront/.env`)
```env
VITE_API_URL=https://your-api.onrender.com
```

## 🔒 Security

- CORS protection with configurable origins
- Input validation on all endpoints
- MongoDB injection prevention
- Environment variable protection
- Secure session handling

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

## 👨‍💻 Author

Ahmad Houssein

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
