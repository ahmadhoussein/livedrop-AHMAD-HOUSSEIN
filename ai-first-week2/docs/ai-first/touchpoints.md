# Touchpoint Specifications – ShopLite

**Probe Documentation:** [See AI Support Assistant Simulation Log](https://github.com/ahmadhoussein/livedrop-AHMAD-HOUSSEIN/blob/main/ai-first-week2/docs/ai-first/probe.png)

AI Support Assistant Simulation

This screenshot provides a log of the **AI Support Assistant** in action, demonstrating both a successful interaction and a planned fallback behavior.

1.  **Happy Path (Successful Query):**
    * **User Input:** The user asks a direct question that the system is designed to handle: "What is my order status?".
    * **System Response:** The assistant successfully retrieves the relevant information from its knowledge base and provides a specific, helpful answer: "Your order #12345 is currently in transit...". This proves the system can accurately handle in-scope queries.

2.  **Fallback Behavior (Out-of-Scope Queries):**
    * **User Input:** The user asks three different questions that are not in the system's knowledge base: "I need to return a shirt.", "What's your return policy?", and "Can I get a refund for my purchase?".
    * **System Response:** The system correctly identifies that it cannot find a relevant answer for any of these queries. Instead of providing a poor or hallucinated response, it executes its fallback plan. It consistently replies with a pre-defined message: "I'm sorry, I cannot find an answer to that question in my knowledge base. Would you like me to connect you with a human agent?".

This simulation log serves as a crucial piece of **feasibility documentation**, confirming that the AI assistant can handle both expected tasks and gracefully fail on out-of-scope requests. It ensures a reliable and safe user experience.
## 1. Smart Search Suggestions

### Problem Statement

Current keyword-based search fails on 23% of queries due to typos, synonyms, and semantic variations ("runing shoes," "sneakers for jogging"). This causes cart abandonment and reduces conversion by an estimated 0.8%. Users expect Google-like search intelligence that understands intent, not just exact matches. Our AI-powered search will reduce query failures to <5% while maintaining sub-300ms latency.

### Happy Path Flow

1. **User Input**: Types ≥3 characters in search bar
2. **Debounce**: 300ms delay to batch keystrokes
3. **Cache Check**: Redis lookup for exact query (TTL: popular=24h, long-tail=1h)
4. **Semantic Processing**: Normalize query, typo correction, semantic expansion
5. **Vector Search**: Query embeddings against pgvector index
6. **Ranking**: Combine semantic score (0.7) + popularity (0.2) + inventory (0.1)
7. **Response Format**: Return 5-8 suggestions with product thumbnails
8. **User Selection**: Click redirects to product page
9. **Analytics**: Log query, results, selection for model improvement
10. **Cache Update**: Store successful query-result pairs

### Grounding & Guardrails

* **Source of Truth**: Product catalog API (10k SKUs, updated hourly)
* **Retrieval Scope**: 100 tokens per product, 384-dim embeddings, similarity ≥0.65, max 8 results
* **Max Context**: 800 tokens total
* **Refuse Outside Scope**: Category redirects, profanity filter, trending fallback

### Human-in-the-Loop

* **Escalation Triggers**: confidence <0.3, zero results, 5+ failures in session, negative feedback
* **UI Surface**: "No results found" message with contact support option
* **Reviewer**: Merchandising team
* **SLA**: Weekly review and adjustments applied within 48 hours

### Latency Budget

| Component           | Budget   |
| ------------------- | -------- |
| Cache lookup        | 30ms     |
| Semantic processing | 50ms     |
| Vector search       | 100ms    |
| Ranking             | 30ms     |
| Response formatting | 15ms     |
| Network return      | 25ms     |
| **Total**           | **250ms (p95)** |

**Cache Strategy**: Redis with 70% hit rate, popular queries cached 24h, long-tail 1h

### Error & Fallback Behavior

* Timeout → fallback to keyword search
* API failure → cached results
* Redis down → DB query
* Total failure → category browse

### PII Handling

* **What Leaves App**: Anonymized search queries only
* **Redaction Rules**: Strip emails/phones from queries
* **Logging Policy**: Retain logs 30 days, GDPR deletion supported

### Success Metrics

* **Product Metric 1**: Click-Through Rate (CTR) = Clicks ÷ Impressions (Target >65%)
* **Product Metric 2**: Query Success Rate = Successful searches ÷ Total searches (Target >95%)
* **Business Metric**: Search-to-Cart Rate = Add-to-cart ÷ Search sessions (Target +15%)

### Feasibility Note

Product catalog API already exists with 10k SKUs updated hourly. Redis and pgvector are deployed in current infrastructure. Will use sentence-transformers library for embeddings generation. Next prototype step: Build embedding pipeline for top 500 SKUs and test semantic similarity scoring with sample queries to validate retrieval quality before full rollout.

---

## 2. AI Support Assistant

### Problem Statement

Support tickets average 4-hour response time with 60% being repetitive queries about order status, return policies, and product information. Human agents handle 1,000 tickets daily at $5/ticket cost. The AI assistant will resolve 70% of queries instantly, reducing operational costs by $3,500/day while improving customer satisfaction through immediate responses.

### Happy Path Flow

1. **User Opens Chat**: Widget loads on support page
2. **Intent Classification**: Classify query (order, policy, product, other)
3. **Cache Check**: Redis lookup for similar queries
4. **Context Retrieval**: Fetch relevant FAQ, order data, product info
5. **Response Generation**: GPT-4o-mini generates contextual response
6. **Confidence Check**: Validate response confidence (threshold 0.8)
7. **Stream Response**: Real-time response delivery to user
8. **Feedback Collection**: Thumbs up/down prompt
9. **Conversation Logging**: Store interaction for improvement
10. **Session Management**: Maintain context for 30 minutes

### Grounding & Guardrails

* **Source of Truth**: FAQ markdown files, Order Status API, Product Catalog API
* **Retrieval Scope**: Max 5 FAQ entries, order details, 3 related products per query
* **Max Context**: 2000 tokens total input to model
* **Refuse Outside Scope**: Legal advice, medical questions, pricing changes, account modifications → escalate immediately

### Human-in-the-Loop

* **Escalation Triggers**: confidence <0.8, flagged keywords, anger/distress detected, high-value transactions, explicit human request
* **UI Surface**: "Connecting you to agent" message with estimated wait time
* **Reviewer**: Customer support manager
* **SLA**: Human agent response within 2 minutes of escalation

### Latency Budget

| Component             | Budget  |
| --------------------- | ------- |
| Intent classification | 50ms    |
| Cache lookup          | 50ms    |
| Context retrieval     | 200ms   |
| Model inference       | 400ms   |
| Response formatting   | 50ms    |
| Streaming delivery    | 50ms    |
| **Total**             | **800ms (p95)** |

**Cache Strategy**: Redis with 30% hit rate, FAQ responses cached 4h, order-specific 30min

### Error & Fallback Behavior

* Timeout → template response "Let me connect you with an agent"
* API unreachable → cached/general answer with escalation
* High load → queue message with estimated wait time
* Context retrieval failure → immediate escalation

### PII Handling

* **What Leaves App**: Order IDs and masked customer names only
* **Redaction Rules**: Mask full names, emails, phone numbers, addresses
* **Logging Policy**: Encrypt conversations at rest, retain 60 days, GDPR-compliant deletion

### Success Metrics

* **Product Metric 1**: Resolution Rate = AI resolved ÷ Total queries (Target 70%)
* **Product Metric 2**: Avg Handle Time = Total handling time ÷ Conversations (Target <90s)
* **Business Metric**: Cost per Resolution = Total AI cost ÷ AI resolutions (Target <$0.50)

### Feasibility Note

FAQ markdown documentation exists with 200+ entries covering common queries. Order Status API is production-ready returning JSON with order details. GPT-4o-mini available via Azure OpenAI with established billing. Next prototype step: Build intent classifier using existing support ticket categories, then test FAQ retrieval accuracy with 50 sample queries to validate response quality and grounding effectiveness.
