# Ahmad Store - LLM to Website Integration Guide

This guide shows you exactly how to connect your Colab LLM to your website for the Week 5 assignment.

## Architecture Overview

```
User Browser (Frontend)
    ↓
Express Backend API (/api/assistant/chat)
    ↓
Assistant Engine (intent classification + grounding)
    ↓
Your Colab LLM (via ngrok /generate endpoint)
    ↓
Response back to user
```

## Step 1: Add `/generate` Endpoint to Your Colab

**In your Colab notebook, add this to CELL 7 (after the `/ping` endpoint):**

```python
@app.route('/generate', methods=['POST'])
def generate():
    """Simple text completion endpoint for Week 5 backend"""
    try:
        data = request.json or {}
        prompt = data.get('prompt', '').strip()
        max_new_tokens = int(data.get('max_new_tokens', 500))
        temperature = float(data.get('temperature', 0.3))
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        response_text = rag_system.generate_response(
            prompt, 
            max_new_tokens=max_new_tokens, 
            temperature=temperature
        )
        
        return jsonify({"text": response_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

**Re-run CELL 7, 8, 9** and note your ngrok URL.

## Step 2: Update `.env` with Your ngrok URL

Create `apps/api/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://chatgptahmad79_db_user:qLH8mqHMyQDF45gU@cluster0.trgvsly.mongodb.net/ahmadstore?retryWrites=true&w=majority

# LLM Endpoint (Your Colab ngrok URL)
LLM_ENDPOINT=https://squirmiest-sharell-superceremoniously.ngrok-free.dev/generate

# Server Config
PORT=3001
NODE_ENV=development
```

**⚠️ IMPORTANT:** Replace `LLM_ENDPOINT` with your actual ngrok URL from Colab!

## Step 3: Test LLM Connection

Test your Colab `/generate` endpoint:

```powershell
# PowerShell command
$body = '{"prompt": "Say hello"}' 
curl.exe -k -X POST -H "Content-Type: application/json" -d $body "https://YOUR-NGROK-URL/generate"
```

Expected response:
```json
{"text": "Hello! ..."}
```

## Step 4: Start Backend API

```bash
cd apps/api
npm install
npm run dev
```

The backend will connect to:
- MongoDB Atlas (for data)
- Your Colab LLM (for assistant responses)

## Step 5: Test Assistant Endpoint

```powershell
# Test assistant endpoint
$body = '{"query": "What is your return policy?", "customerId": "test123"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/assistant/chat" -Method Post -Body $body -ContentType "application/json"
```

Expected response:
```json
{
  "text": "Ahmad Store offers a comprehensive 30-day return policy... [Policy3.1]",
  "intent": "policy_question",
  "citations": ["Policy3.1"],
  "sources": ["Policy3.1"]
}
```

## Step 6: Frontend Integration

Update `apps/storefront/src/lib/api.ts`:

```typescript
// Add assistant API call
export async function sendMessage(query: string, context?: any) {
  const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...context })
  });
  return response.json();
}
```

Update `apps/storefront/src/components/SupportAssistant.tsx`:

```tsx
import { sendMessage } from '../lib/api';

export function SupportAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);
    
    try {
      // Call backend assistant API
      const response = await sendMessage(input);
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.text,
        intent: response.intent,
        citations: response.citations 
      }]);
    } catch (error) {
      console.error('Assistant error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.citations && (
              <div className="citations">
                Sources: {msg.citations.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about Ahmad Store..."
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

## How It Works - Complete Flow

### Example: User asks "What is your return policy?"

1. **Frontend** → User types question in `SupportAssistant` component
2. **API Call** → Frontend calls `POST /api/assistant/chat` with `{"query": "What is your return policy?"}`
3. **Backend receives** → Express route handler in `apps/api/src/routes/assistant.js`
4. **Intent Classification** → `AssistantEngine.classifyIntent()` detects "policy_question"
5. **Grounding** → `findRelevantPolicies()` searches `ground-truth.json` using keywords → Finds "Policy3.1" about returns
6. **Prompt Building** → Creates prompt with Sarah's identity + policy context + user question
7. **LLM Call** → Sends prompt to your Colab `/generate` endpoint via ngrok
8. **Colab LLM** → Phi-3 model generates response based on grounded prompt
9. **Citation Extraction** → Extracts `[Policy3.1]` from response
10. **Citation Validation** → Verifies Policy3.1 exists in ground-truth.json
11. **Response** → Returns `{ text: "...[Policy3.1]", intent: "policy_question", citations: ["Policy3.1"] }`
12. **Frontend displays** → Shows response with citations

### Example 2: User asks "Track my order #12345"

1-3. Same as above
4. **Intent** → Detects "order_status"
5. **Function Call** → Executes `getOrderStatus("12345")` → Queries MongoDB
6. **Prompt** → Builds prompt with order data (status, carrier, ETA)
7-11. LLM generates friendly response about order status
12. **Response** → `{ text: "Your order is currently shipped...", intent: "order_status", functionsCalled: ["getOrderStatus"] }`

## Testing Checklist

- [ ] Colab `/generate` endpoint responds
- [ ] Backend connects to MongoDB
- [ ] Backend can call Colab LLM
- [ ] Assistant classifies intents correctly
- [ ] Policy questions return grounded answers with citations
- [ ] Order status queries call `getOrderStatus` function
- [ ] Product search queries call `searchProducts` function
- [ ] Frontend chat UI sends/receives messages
- [ ] Citations display in frontend

## Common Issues & Solutions

### Issue: "Failed to connect to LLM"
**Solution:** Check that:
- Colab is running
- ngrok tunnel is active
- `LLM_ENDPOINT` in `.env` matches your ngrok URL
- No trailing slash in URL

### Issue: "Policy citations not showing"
**Solution:** 
- Verify `ground-truth.json` has correct PolicyIDs
- Check `extractCitations()` regex pattern
- LLM might not be including citations - adjust prompt

### Issue: "Functions not being called"
**Solution:**
- Check intent classification logic
- Verify function registry is initialized with `db` connection
- Test functions directly in `function-registry.js`

## Next Steps

1. **Add SSE for live order tracking** (`/api/orders/:id/stream`)
2. **Build admin dashboard** with metrics
3. **Write tests** (intent detection, functions, integration)
4. **Deploy** backend to Render, frontend to Vercel
5. **Update documentation** with deployment URLs

## Environment Variables Reference

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# LLM
LLM_ENDPOINT=https://your-ngrok-url.ngrok-free.dev/generate

# Server
PORT=3001
NODE_ENV=development

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Deployment URLs

Once deployed, update these in your README:

- **Frontend:** https://ahmad-store.vercel.app
- **Backend API:** https://ahmad-store-api.onrender.com
- **LLM (Colab):** https://your-subdomain.ngrok-free.dev
- **MongoDB:** mongodb+srv://... (keep secret!)

## Test User for Evaluation

**Email:** demo@ahmadstore.com
**Customer ID:** (will be in MongoDB after seeding)
**Test Orders:** Order IDs associated with this user

Document this in your main README.md for the instructor.
