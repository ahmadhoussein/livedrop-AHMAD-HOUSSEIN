# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Ahmad Store is a full-stack e-commerce platform with an AI-powered customer support assistant. The project uses a monorepo structure with separate frontend and backend applications.

**Tech Stack:**
- Backend: Node.js (v20+) + Express + MongoDB
- Frontend: React + TypeScript + Vite
- AI Assistant: Custom intent classification engine with bilingual support (English/Arabic)

## Commonly Used Commands

### Development Setup

```bash
# Install all dependencies (both apps)
npm run install:all

# Or install individually
npm run install:api
npm run install:frontend
```

### Running the Applications

```bash
# Development mode (recommended)
npm run dev:api          # API server with auto-reload (port 3001)
npm run dev:frontend     # Frontend dev server (port 5173)

# Production mode
npm run start:api        # API server (production)
npm run start:frontend   # Frontend dev server
```

### Database Management

```bash
# Seed database with sample data
npm run seed            # Run from root or apps/api
cd apps/api && npm run seed:categories  # Seed only categories
```

### Testing

```bash
# Run all tests
npm test                # From root (runs tests in /tests)

# API tests
cd apps/api && npm test

# Frontend tests
cd apps/storefront && npm test          # Run tests once
cd apps/storefront && npm run test      # Watch mode (vitest)
```

### Building for Production

```bash
# Build frontend only
npm run build           # From root
cd apps/storefront && npm run build

# API build (no build step, just install production deps)
cd apps/api && npm ci --only=production
```

### AI Assistant Management

```bash
# Reload knowledge base without restarting server
cd apps/api && npm run kb:reload

# Build knowledge base from external docs
cd apps/api && npm run kb:build
```

### Deployment Preparation

```bash
# Check if project is ready for deployment
npm run check-deploy

# Prepare for deployment (runs checks)
npm run prepare-deploy
```

## High-Level Architecture

### Monorepo Structure

The project follows a monorepo pattern with workspaces defined in the root `package.json`. The two main applications (`apps/api` and `apps/storefront`) are developed and deployed independently.

### Backend Architecture (`apps/api`)

**Core Components:**

1. **Assistant Engine** (`src/assistant/`)
   - **engine.js**: Main orchestrator for AI assistant, handles LLM integration (Hugging Face fallback), response generation with citation validation, and bilingual support
   - **intent-classifier.js**: Classifies user queries into 7 intents (policy_question, order_status, product_search, complaint, chitchat, off_topic, violation)
   - **function-registry.js**: Callable functions that connect to MongoDB services (getOrderStatus, searchProducts, getCustomerOrders)
   - **citation-validator.js**: Validates citations against knowledge base, extracts citations from responses (e.g., [Policy1.1])
   - **synonyms.js**: Bilingual support with Arabic language detection, query expansion with synonyms, cross-lingual hints

2. **Services** (`src/services/`)
   - MongoDB-based services for customers, products, orders, categories
   - Each service follows a similar pattern: connection management, CRUD operations, search/filtering

3. **SSE (Server-Sent Events)** (`src/sse/`)
   - Real-time order status updates
   - Uses in-memory simulation for demo purposes
   - Endpoint: `GET /api/orders/:id/stream`

4. **Configuration**
   - Environment config loaded via `dotenv` from `config.env`
   - Knowledge base: `docs/ground-truth.json` (17+ store policies)
   - Assistant config: `docs/prompts.yaml` (personality, intents, rules)

**Key Design Patterns:**

- **Intent-based routing**: User queries are classified first, then routed to appropriate handlers
- **Citation enforcement**: Policy responses must include citations from knowledge base
- **Fallback chain**: LLM_ENDPOINT → Hugging Face API → Deterministic responses
- **Hot-reloading**: Knowledge base can be reloaded without server restart via `/api/assistant/kb/reload`

### Frontend Architecture (`apps/storefront`)

**Core Components:**

1. **Pages** (`src/pages/`)
   - Route-level components (Home, Products, Cart, Checkout, Orders, etc.)
   - Each page typically fetches data via the API client and manages local state

2. **Components** (`src/components/`)
   - Reusable UI components (buttons, cards, forms, etc.)
   - **SupportAssistant.tsx**: Chat interface for AI assistant
   - Uses Radix UI primitives for accessible components

3. **State Management**
   - Zustand for global state (cart, user session)
   - Local component state with React hooks

4. **API Client** (`src/lib/api.ts`)
   - Centralized API communication using axios
   - Methods for products, orders, customers, analytics, and assistant
   - Base URL configured via `VITE_API_URL` environment variable

**Key Design Patterns:**

- **Client-side routing**: React Router for navigation
- **Optimistic updates**: Cart updates happen optimistically before API confirmation
- **SSE integration**: EventSource for real-time order tracking

### AI Assistant Data Flow

1. User sends message → Frontend `SupportAssistant.tsx`
2. API call to `POST /api/assistant/chat` with message + context
3. Backend `engine.js` processes:
   - Classify intent using keyword matching (intent-classifier.js)
   - Expand query with synonyms if bilingual (synonyms.js)
   - Execute functions from registry if needed (function-registry.js)
   - Find relevant policies from knowledge base (citation-validator.js)
   - Generate response (LLM or deterministic)
   - Validate citations
4. Return response with intent, citations, functions called, and response time
5. Frontend displays message with metadata

### Database Layer

- **MongoDB Atlas** (production) or local MongoDB (development)
- Collections: customers, products, categories, orders
- Connection management in `src/db.js`
- Auto-seeding on first run if `AUTO_SEED=true`

### Deployment Architecture

- **Backend**: Render Web Service (Node.js)
  - Root directory: `apps/api`
  - Start command: `node src/server.js`
  - Health check: `/api/health`

- **Frontend**: Vercel (or any static host)
  - Root directory: `apps/storefront`
  - Build command: `npm run build`
  - Output: `dist/`

- **Database**: MongoDB Atlas (free tier)

## Important Environment Variables

### Backend (`apps/api/config.env`)

```env
# Required
MONGODB_URI=mongodb+srv://...           # MongoDB connection string
NODE_ENV=production|development
PORT=3001

# Optional - CORS
CORS_ORIGINS=http://localhost:5173,https://your-domain.com

# Optional - Auto-seed
AUTO_SEED=true                          # Seed database on startup

# Optional - AI Assistant
HUGGINGFACE_TOKEN=hf_...                # Hugging Face API token (fallback LLM)
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
LLM_ENDPOINT=http://localhost:8000      # Custom LLM service
```

### Frontend (`apps/storefront/.env`)

```env
VITE_API_URL=http://localhost:3001      # Backend API URL
```

## Code Conventions

### Backend

- **CommonJS modules**: Uses `require()` and `module.exports`
- **Async/await**: Preferred over promise chains
- **Error handling**: Try-catch blocks with meaningful error messages, global error handler middleware
- **Logging**: `console.log` for info, `console.error` for errors (consider structured logging for production)

### Frontend

- **ES modules**: Uses `import`/`export`
- **TypeScript**: Strict mode, explicit typing for props and state
- **Functional components**: React hooks over class components
- **CSS**: TailwindCSS utility classes + CSS modules for custom styles

## Testing Strategy

- **Unit tests**: Individual functions and components (Jest for backend, Vitest for frontend)
- **Integration tests**: API endpoints with supertest (`tests/integration.test.js`)
- **Assistant tests**: Intent classification, function execution, citation validation (`tests/assistant.test.js`)

## Key Files to Understand

- `apps/api/src/server.js` - Main entry point, middleware setup, route registration
- `apps/api/src/assistant/engine.js` - AI assistant orchestrator
- `apps/storefront/src/lib/api.ts` - Frontend API client
- `docs/ground-truth.json` - Knowledge base for assistant
- `docs/prompts.yaml` - Assistant configuration and personality

## Bilingual Support (Arabic/English)

The AI assistant supports both English and Arabic:

- **Language detection**: Automatically detects Arabic characters in user queries
- **Query expansion**: Synonyms and translations improve search accuracy
- **Cross-lingual hints**: Helps understand queries in both languages
- **Response language**: Matches user's input language

When working with Arabic text:
- Use Unicode-safe string operations
- Test with Arabic input in both frontend and backend
- Ensure MongoDB supports Arabic text indexing

## Known Constraints

- Free tier MongoDB: 512MB storage limit
- Free tier Render: Spins down after 15 minutes of inactivity (causes cold starts)
- Node.js version: **Must be v20+** (specified in `package.json` engines)
- SSE limitations: Current implementation uses in-memory simulation (not production-ready for multi-instance deployments)

## Adding New Features

### Adding a new API endpoint:

1. Create route handler in `apps/api/src/routes/`
2. Add service logic in `apps/api/src/services/`
3. Register route in `apps/api/src/server.js`
4. Add API client method in `apps/storefront/src/lib/api.ts`
5. Write tests in `tests/`

### Adding a new assistant function:

1. Add function to `apps/api/src/assistant/function-registry.js`
2. Update intent classifier if needed (`intent-classifier.js`)
3. Test via `POST /api/assistant/chat` endpoint
4. Add to assistant info response

### Adding new policies to knowledge base:

1. Edit `docs/ground-truth.json`
2. Follow existing structure: `id`, `question`, `answer`, `category`, `keywords`, `timestamp`
3. Reload knowledge base: `curl -X POST http://localhost:3001/api/assistant/kb/reload`
4. Test by asking related questions

## Debugging Tips

- **API not connecting**: Check `MONGODB_URI` is correct and network access is allowed
- **CORS errors**: Add frontend URL to `CORS_ORIGINS` in backend config
- **Assistant not responding**: Check `docs/ground-truth.json` and `docs/prompts.yaml` are present
- **Build failures**: Ensure `package-lock.json` is committed and `node-fetch` is in `dependencies` (not `devDependencies`)
- **SSE not working**: Check browser console for EventSource errors, ensure endpoint is `/api/orders/:id/stream`
