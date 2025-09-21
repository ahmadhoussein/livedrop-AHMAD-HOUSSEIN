# Touchpoint Specifications – ShopLite

---

## 1. Smart Search Suggestions

### Problem Statement
Users abandon searches if results are irrelevant or fail on typos (“runing shoes”). Keyword-only search underperforms, hurting conversions. AI-powered suggestions can understand intent and improve discovery.

### Happy Path
1. User types ≥3 chars in search bar.
2. Query debounced (300ms) then sent to search API.
3. Redis cache checked for common queries (TTL: popular = 24h, long-tail = 1h).
4. If miss, semantic deduplication normalizes queries (e.g., “runing shoes” → “running shoes”).
5. AI embedding search runs against product catalog in vector DB (pgvector for low latency).
6. 5–8 suggestions ranked by relevance + popularity.
7. Dropdown shows corrected terms & product matches.
8. User clicks → redirected to product page.
9. Event logged for analytics.
10. Cache updated for reuse.

### Grounding & Guardrails
- Source: product catalog (10k SKUs).
- Retrieval scope: active, in-stock products only.
- Max context: titles + attributes ≤100 tokens each.
- Out-of-scope → fallback to keyword search.

### Human-in-the-loop
- Trigger: query confidence <0.3 or zero results.
- UI: “Didn’t find it?” → link to support.
- Reviewer: merchandising team, weekly QA.
- SLA: review top 100 queries weekly.

### Latency Budget
- Debounce: 300ms
- Cache lookup: 50ms
- Semantic dedup + vector retrieval: 120ms
- Model rerank: 50ms
- Rendering: 30ms
- **Total ≤250ms (p95)**

### Error & Fallback
- Model/API fail → keyword search.
- Network fail → cached results or trending products.

### PII Handling
- Only query text sent, no IDs.
- Strip patterns like emails/phones.
- Logs aggregated, retained ≤30 days.

### Success Metrics
- CTR = Clicked suggestions / Suggestions shown.
- Search-to-cart rate = Sessions with add-to-cart / Search sessions.
- AI accuracy = Precision & recall of suggestions vs ground truth.
- Business metric: Conversion uplift (%) vs baseline.

### Feasibility Note
Catalog API + metadata ready. Vector DB (pgvector) feasible with low-latency Postgres integration. Next step: build embeddings for 500 SKUs, run typo simulation (“iphon” → “iPhone”), benchmark <250ms latency.

---

## 2. AI Support Assistant

### Problem Statement
60% of support tickets are repetitive (order status, return policy). Customers wait hours for answers. Automating these queries improves satisfaction and reduces human workload.

### Happy Path
1. User opens chat widget.
2. Asks: “Where is my order?”.
3. Redis cache checked for FAQ (TTL: 4h).
4. If miss, embed + retrieve FAQ with vector DB.
5. If order-related, call order-status API by order ID.
6. AI generates grounded response with retrieval context.
7. Confidence <0.8 → escalate to human.
8. Response delivered in ≤1000ms.
9. Conversation + CSAT logged for QA.

### Grounding & Guardrails
- Sources: FAQ markdown + order-status API.
- Retrieval scope: internal docs only.
- Max context: ≤1000 tokens.
- Refuse scope: out-of-policy → escalate.

### Human-in-the-loop
- Triggers: low confidence (<0.8), refunds >$100, complaints.
- UI: “Talk to human” always visible.
- Reviewer: senior agent.
- SLA: response ≤10min.

### Latency Budget
- Cache lookup: 50ms
- Retrieval: 200ms
- API call: 300ms
- Model inference: 350ms
- Formatting: 100ms
- **Total ≤1000ms (p95)**

### Error & Fallback
- Model fail → template “Please contact support.”
- API fail → general policy answer + escalate.
- Hallucination prevention → always show source (FAQ snippet, order ID from API).

### PII Handling
- Mask order IDs before sending to model.
- Strip names, addresses, CC numbers.
- Logs encrypted, retained ≤60 days.

### Success Metrics
- Resolution rate = AI resolved / Total queries.
- Avg response time (ms).
- CSAT (1–5 rating after chat).
- Business metric: Support ticket reduction = (Baseline – Post-AI)/Baseline.

### Feasibility Note
FAQ file + order-status API already exist. RAG pipeline with embeddings is straightforward. Next step: run 50 sample queries, measure accuracy, ensure hallucinations <2%.
