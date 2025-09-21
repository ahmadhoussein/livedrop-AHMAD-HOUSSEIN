# Touchpoint Specifications – ShopLite

---

## 1. Smart Search Suggestions

### Problem Statement
Users abandon searches if results are irrelevant or fail on typos (“runing shoes”). Keyword-only search underperforms, hurting conversions. AI-powered suggestions can understand intent and improve discovery.

### Happy Path
1. User types ≥3 chars in search bar.
2. Query debounced (300ms) then sent to API.
3. Cache checked for common queries.
4. If miss, AI embedding search runs against product catalog.
5. 5–8 suggestions ranked by relevance + popularity.
6. Dropdown shows corrected terms & product matches.
7. User clicks → redirected to product page.
8. Event logged for analytics.
9. Cache updated for reuse.

### Grounding & Guardrails
- Source: product catalog (10k SKUs).
- Retrieval scope: active, in-stock products only.
- Max context: ~200 tokens per product.
- Out-of-scope (e.g., “mortgage rates”) → fallback to keyword search.

### Human-in-the-loop
- Trigger: query confidence <0.3 or zero results.
- UI: “Didn’t find it?” → link to support.
- Reviewer: merchandising team, weekly QA.
- SLA: review top 100 queries weekly.

### Latency Budget
- Debounce: 300ms
- Cache lookup: 50ms
- Model retrieval + inference: 150ms
- Ranking & return: 50ms
- **Total ≤250ms (p95)**

### Error & Fallback
- Model/API fail → default keyword search.
- Network fail → cached results or trending searches.

### PII Handling
- Only query text sent, no IDs.
- Strip patterns like emails/phones.
- Logs aggregated, retained ≤30 days.

### Success Metrics
- CTR = Clicked suggestions / Suggestions shown.
- Search-to-cart = Sessions with add-to-cart after search / Search sessions.
- Business metric: Conversion uplift (%) vs baseline search.

### Feasibility Note
Product catalog API exists. Use vector search (e.g., FAISS/ANN). Next step: prototype embeddings on 100 SKUs, test typo tolerance, measure latency.

---

## 2. AI Support Assistant

### Problem Statement
60% of support tickets are repetitive (order status, return policy). Customers wait hours for answers. Automating these queries improves satisfaction and reduces human workload.

### Happy Path
1. User opens chat widget.
2. Asks question (“Where is my order?”).
3. Cache checked for FAQ.
4. If miss, embed + retrieve from FAQ.
5. If order-related, call order-status API.
6. AI generates clear response.
7. Confidence <0.8 → escalate to human.
8. Reply delivered in ≤1000ms.
9. Session logged for QA.

### Grounding & Guardrails
- Sources: FAQ markdown + order-status API.
- Retrieval scope: internal docs only.
- Max context: ≤1000 tokens.
- Out-of-scope → “Sorry, can’t answer” + escalate.

### Human-in-the-loop
- Triggers: low confidence (<0.8), refunds >$100, complaints.
- UI: “Talk to human” always available.
- Reviewer: senior agent.
- SLA: human response ≤10min in hours.

### Latency Budget
- Cache: 50ms
- Retrieval: 200ms
- API call: 300ms
- Model inference: 400ms
- Formatting: 50ms
- **Total ≤1000ms (p95)**

### Error & Fallback
- Model fails → template: “Contact support.”
- API fails → general policy info + escalate.

### PII Handling
- Mask order IDs before model.
- Strip names, addresses, CC numbers.
- Logs encrypted, kept ≤60 days.

### Success Metrics
- Resolution rate = AI resolved / Total queries.
- Avg response time (ms).
- Business metric: (Baseline tickets – Post-AI tickets)/Baseline.

### Feasibility Note
FAQ exists. Order-status API live. Next step: RAG pipeline with embeddings. Test 50 sample queries for accuracy + latency.

