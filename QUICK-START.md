# Quick Start Guide - Connect Your LLM to Website

## What You Have Now

✅ **Working Colab LLM** with `/chat`, `/ping`, `/health` endpoints  
✅ **ngrok URL**: `https://squirmiest-sharell-superceremoniously.ngrok-free.dev`  
✅ **MongoDB Atlas** credentials  
✅ **Backend API structure** in `apps/api/`  

## What You Need To Do

### 1. Add `/generate` Endpoint to Colab (5 minutes)

Copy this file to your Colab: `colab-generate-endpoint.py`

Paste the code into **CELL 7** (after `/ping` endpoint), then re-run cells 7, 8, 9.

### 2. Create `.env` File (2 minutes)

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and update:
- `MONGODB_URI` - your MongoDB connection string
- `LLM_ENDPOINT` - your ngrok URL + `/generate`

### 3. Install & Start Backend (3 minutes)

```bash
cd apps/api
npm install
npm run dev
```

Should see:
```
Server running on port 3001
MongoDB connected
```

### 4. Test Integration (2 minutes)

Run the test script:
```powershell
.\test-integration.ps1
```

All 5 tests should pass ✓

### 5. Test From Browser

Open: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "llm": "connected"
}
```

## Test the Assistant

### Test 1: Policy Question
```powershell
$body = '{"query": "What is your return policy?"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/assistant/chat" -Method Post -Body $body -ContentType "application/json"
```

**Expected:**
- Intent: `policy_question`
- Citations: `["Policy3.1"]`
- Response mentions "30 days"

### Test 2: Product Search
```powershell
$body = '{"query": "Show me laptops"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/assistant/chat" -Method Post -Body $body -ContentType "application/json"
```

**Expected:**
- Intent: `product_search`
- Functions called: `["searchProducts"]`
- Products array returned

### Test 3: Order Status
```powershell
$body = '{"query": "Track order 67305ff12f8dd9f2cbcf8a38"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/assistant/chat" -Method Post -Body $body -ContentType "application/json"
```

**Expected:**
- Intent: `order_status`
- Functions called: `["getOrderStatus"]`
- Order data returned

## Frontend Integration

1. **Start frontend:**
```bash
cd apps/storefront
npm run dev
```

2. **Update API URL** in `apps/storefront/.env`:
```env
VITE_API_URL=http://localhost:3001
```

3. **Test chat UI** at http://localhost:3000

## Common Issues

### "Cannot connect to LLM"
- Check Colab is running
- Check ngrok tunnel is active
- Verify `LLM_ENDPOINT` in `.env` matches your ngrok URL
- Must end with `/generate` not `/chat`

### "MongoDB connection failed"
- Check `MONGODB_URI` in `.env`
- Whitelist IP `0.0.0.0/0` in MongoDB Atlas Network Access
- Test connection string in MongoDB Compass first

### "Assistant returns generic responses"
- Check `docs/ground-truth.json` exists
- Check `docs/prompts.yaml` exists
- Verify intent classification logic in `assistant/engine.js`

### "No citations in responses"
- LLM might not be adding `[PolicyID]` format
- Check prompt includes citation instructions
- Validate `extractCitations()` regex in engine.js

## Architecture Flow

```
User Question: "What is your return policy?"
    ↓
Frontend (SupportAssistant.tsx)
    ↓ POST /api/assistant/chat
Backend API (routes/assistant.js)
    ↓
AssistantEngine.processQuery()
    ├→ classifyIntent() → "policy_question"
    ├→ findRelevantPolicies() → searches ground-truth.json
    ├→ buildPrompt() → includes PolicyID context
    ├→ callLLM() → POST to ngrok/generate
    └→ Colab LLM generates response with [PolicyID]
    ↓
extractCitations() + validateCitations()
    ↓
Response: {
  text: "30-day return policy [Policy3.1]",
  intent: "policy_question",
  citations: ["Policy3.1"]
}
    ↓
Frontend displays with citations
```

## Files You Need to Review

1. **`INTEGRATION-GUIDE.md`** - Complete step-by-step guide
2. **`docs/prompts.yaml`** - Assistant identity and behavior
3. **`docs/ground-truth.json`** - Policy knowledge base
4. **`apps/api/src/assistant/engine.js`** - Main assistant logic
5. **`apps/api/src/assistant/function-registry.js`** - Function calling
6. **`test-integration.ps1`** - Automated testing

## Next Steps

Once basic integration works:

1. ✅ Test all 7 intent types
2. ✅ Add SSE for real-time order tracking
3. ✅ Build admin dashboard
4. ✅ Write automated tests
5. ✅ Deploy to Render + Vercel
6. ✅ Update documentation

## Support

If stuck, check:
- `INTEGRATION-GUIDE.md` for detailed explanations
- Your backend logs: `apps/api/` terminal output
- Your Colab logs: Colab cell outputs
- MongoDB Atlas logs: in Atlas dashboard

Good luck! 🚀
