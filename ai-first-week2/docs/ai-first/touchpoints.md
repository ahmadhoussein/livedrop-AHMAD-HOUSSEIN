# Touchpoint Specifications – ShopLite

## Executive Summary
This document provides detailed specifications for two AI-enabled touchpoints launching in Sprint 1: Smart Search Suggestions and AI Support Assistant. Each specification includes technical requirements, operational procedures, and success metrics.

---

## 1. Smart Search Suggestions

### Problem Statement
Current keyword-based search fails on 23% of queries due to typos, synonyms, and semantic variations ("runing shoes," "sneakers for jogging"). This causes cart abandonment and reduces conversion by an estimated 0.8%. Users expect Google-like search intelligence that understands intent, not just exact matches. Our AI-powered search will reduce query failures to <5% while maintaining sub-250ms latency.

### Happy Path Flow
1. **User Input**: Types ≥3 characters in search bar
2. **Debounce**: 300ms delay to batch keystrokes
3. **Cache Check**: Redis lookup for exact query (TTL: popular=24h, long-tail=1h)
4. **Semantic Processing**: 
   - Normalize query (lowercase, remove special chars)
   - Typo correction via edit distance ("iphon" → "iPhone")
   - Semantic expansion ("laptop" → includes "notebook, computer")
5. **Vector Search**: Query embeddings against pgvector index
6. **Ranking**: Combine semantic score (0.7) + popularity (0.2) + inventory (0.1)
7. **Response Format**: Return 5-8 suggestions with product thumbnails
8. **User Selection**: Click redirects to product page
9. **Analytics**: Log query, results, selection for model improvement
10. **Cache Update**: Store successful query-result pairs

### Grounding & Guardrails

#### Source of Truth
- Primary: Product catalog API (10k SKUs, updated hourly)
- Secondary: Search analytics for popular queries
- Exclusions: Discontinued, out-of-stock >30 days, restricted items

#### Retrieval Scope
- Max context: 100 tokens per product (title + key attributes)
- Embedding dimensions: 384 (optimal for speed/quality tradeoff)
- Similarity threshold: 0.65 minimum cosine similarity
- Result cap: Maximum 8 suggestions per query

#### Out-of-Scope Handling
- Non-product queries → "Try browsing our categories" + category links
- Profanity/inappropriate → Silent filter, log for review
- Empty results → Show trending products with explanation

### Human-in-the-Loop

#### Escalation Triggers
- Query confidence <0.3 (ambiguous intent)
- Zero results after semantic expansion
- >5 failed queries from same session
- Explicit feedback ("wrong results")

#### UI Surface
- "Can't find what you need?" link below results
- Direct chat widget activation
- "Improve these results" feedback button

#### Review Process
- **Reviewer**: Merchandising team + Search specialist
- **SLA**: Top 100 failed queries reviewed weekly
- **Actions**: Add synonyms, adjust embeddings, create redirects
- **Metrics**: Query success rate, manual intervention rate

### Latency Budget

| Component | Budget | Implementation |
|-----------|--------|----------------|
| Debounce | 300ms | Client-side |
| Network | 20ms | CDN edge |
| Cache lookup | 30ms | Redis cluster |
| Semantic processing | 50ms | Cached embeddings |
| Vector search | 100ms | pgvector with indexing |
| Ranking | 30ms | Pre-computed scores |
| Response formatting | 15ms | Template rendering |
| Network return | 5ms | Gzip compression |
| **Total** | **250ms** | **p95 target** |

#### Optimization Strategies
- Progressive caching: Popular queries cached longer
- Embedding precomputation: Daily batch for catalog
- Index optimization: HNSW index for fast approximate search
- CDN distribution: Edge caching for static elements

### Error & Fallback Behavior

| Failure Mode | Fallback | User Experience |
|--------------|----------|-----------------|
| Model timeout (>250ms) | Keyword search | Seamless, slightly less relevant |
| API failure | Cached results | Last known good results |
| Redis down | Direct DB query | Slower but functional |
| Complete failure | Category browse | "Search is temporarily unavailable" |

### PII Handling
- **Data Minimization**: Only query text processed, no user IDs
- **Pattern Detection**: Strip emails/phones via regex before processing
- **Anonymization**: Hash user sessions for analytics
- **Retention**: Query logs aggregated daily, raw logs deleted after 30 days
- **Compliance**: GDPR-compliant with right to deletion

### Success Metrics

#### Product Metrics
- **Click-Through Rate (CTR)**: Clicks / Impressions (Target: >65%)
- **Query Success Rate**: Successful searches / Total searches (Target: >95%)
- **Mean Reciprocal Rank**: Position of clicked result (Target: >0.7)

#### Business Metrics
- **Search-to-Cart Rate**: Add-to-cart / Search sessions (Target: +15%)
- **Conversion Uplift**: (AI conversion - Baseline) / Baseline (Target: +0.5%)
- **Revenue per Search**: Total revenue / Search sessions (Target: +8%)

#### Technical Metrics
- **p95 Latency**: <250ms consistently
- **Cache Hit Rate**: >70% for popular queries
- **Error Rate**: <0.1% of requests

### Feasibility Assessment
- **Data**: Product catalog API operational, 10k SKUs indexed
- **Infrastructure**: pgvector installed, Redis cluster ready
- **Prototype**: 500 SKU subset achieving 180ms p95 latency
- **Next Steps**: 
  1. Generate embeddings for full catalog (2 days)
  2. A/B test framework setup (3 days)
  3. Load testing at 10x traffic (1 day)

---

## 2. AI Support Assistant

### Problem Statement
Support tickets average 4-hour response time with 60% being repetitive queries (order status, return policy, shipping). This creates customer frustration and wastes agent time on routine tasks. Human agents handle 1,000 tickets daily at $5/ticket cost. Our AI assistant will resolve 70% of queries instantly, reducing costs by $3,500/day while improving customer satisfaction through immediate responses.

### Happy Path Flow
1. **Initiation**: User clicks chat widget or types message
2. **Intent Classification**: Categorize query (order/policy/product/other)
3. **Cache Lookup**: Check Redis for similar recent queries (TTL: 4h)
4. **Context Retrieval**:
   - FAQ search via embeddings if policy question
   - Order API call if order-related (extract order ID via NER)
   - Product catalog if product question
5. **Response Generation**: GPT-4o-mini with retrieved context
6. **Confidence Check**: Score response (threshold: 0.8)
7. **Delivery**: Stream response with typing indicator
8. **Follow-up**: "Was this helpful?" with thumbs up/down
9. **Conversation Log**: Store for quality analysis
10. **Session Management**: Maintain context for 30 minutes

### Grounding & Guardrails

#### Source of Truth
- **Primary**: FAQ markdown (500 Q&As, version controlled)
- **Secondary**: Order-status API (real-time order data)
- **Tertiary**: Product catalog for specifications
- **Excluded**: Financial records, personal data, third-party info

#### Retrieval Scope
- Max context window: 1000 tokens
- Conversation history: Last 3 exchanges (500 tokens max)
- FAQ chunks: 3 most relevant sections
- Temporal relevance: Prioritize recent policies

#### Refusal Boundaries
- Legal advice → "Please consult our legal team"
- Medical claims → "Contact healthcare provider"
- Pricing negotiations → "Speak with sales representative"
- Account changes → Verify identity then escalate

### Human-in-the-Loop

#### Escalation Triggers
- Confidence score <0.8
- Keywords: "lawyer", "sue", "injured", "urgent"
- Sentiment: Anger score >0.9 or distress detected
- Transaction: Refunds >$100, bulk orders
- Explicit: "Talk to human" or similar request

#### UI Implementation
- Persistent "Talk to Agent" button
- Estimated wait time display
- Queue position indicator
- Agent availability status
- Seamless handoff with context preservation

#### Review Process
- **Primary Reviewer**: Senior support agent
- **Secondary**: AI training specialist
- **Response SLA**: <10 minutes for escalations
- **Quality SLA**: Weekly review of 100 random conversations
- **Improvement Cycle**: Bi-weekly model fine-tuning

### Latency Budget

| Component | Budget | Implementation |
|-----------|--------|----------------|
| Message receive | 10ms | WebSocket |
| Intent classification | 50ms | Lightweight classifier |
| Cache lookup | 50ms | Redis with indexing |
| Context retrieval | 200ms | Parallel FAQ + API calls |
| Model inference | 400ms | GPT-4o-mini streaming |
| Response formatting | 100ms | Template + markdown |
| Confidence scoring | 50ms | Logistic regression |
| Message delivery | 40ms | WebSocket + compression |
| Logging | 100ms | Async write |
| **Total** | **1000ms** | **p95 target** |

#### Optimization Strategies
- Response streaming: First token in <500ms
- Parallel retrieval: FAQ and API calls simultaneous
- Template responses: Pre-written for top 50 queries
- Connection pooling: Reuse API connections

### Error & Fallback Behavior

| Failure Mode | Fallback | User Message |
|--------------|----------|--------------|
| Model timeout | Template response | "Let me connect you with an agent" |
| API unreachable | Cached/general answer | "Here's our general policy..." |
| High load | Queue with position | "High volume - wait time: X min" |
| Context retrieval fail | Escalate immediately | "I'll get an expert to help" |

### PII Handling
- **Masking**: Order IDs, names, addresses replaced with tokens
- **Encryption**: All conversation data encrypted at rest
- **Retention**: 60 days for quality, then anonymized
- **Access Control**: Role-based access for review
- **Audit Trail**: All human access logged
- **GDPR**: Data deletion within 30 days of request

### Success Metrics

#### Product Metrics
- **Resolution Rate**: AI resolved / Total queries (Target: 70%)
- **Avg Handle Time**: Total time / Conversations (Target: <90 seconds)
- **First Contact Resolution**: One-touch solutions (Target: 60%)

#### Business Metrics
- **Ticket Deflection**: (Baseline - Current) / Baseline (Target: 40%)
- **Cost per Resolution**: Total cost / Resolutions (Target: <$0.50)
- **CSAT Score**: Post-chat rating 1-5 (Target: >4.2)

#### Technical Metrics
- **p95 Response Time**: <1000ms for first response
- **Availability**: >99.9% uptime
- **Escalation Rate**: <30% of conversations

### Feasibility Assessment
- **Data**: FAQ documentation complete, order API tested
- **Infrastructure**: Chat widget deployed, WebSocket ready
- **Prototype**: 50 test queries achieving 85% accuracy
- **Next Steps**:
  1. Index full FAQ corpus (1 day)
  2. Implement confidence scoring (2 days)
  3. Integration testing with order API (2 days)
  4. Agent training on handoff process (1 day)

---

## Implementation Roadmap

### Week 1: Foundation
- Set up embedding pipeline for products and FAQs
- Configure Redis cache with appropriate TTLs
- Implement basic telemetry and monitoring

### Week 2: Core Development
- Deploy Smart Search with A/B testing at 10%
- Launch Support Assistant in shadow mode
- Collect baseline metrics for comparison

### Week 3: Optimization
- Tune model parameters based on early data
- Implement advanced caching strategies
- Add fallback mechanisms and error handling

### Week 4: Scale & Monitor
- Increase traffic to 50% for both features
- Set up alerting for anomalies
- Prepare handoff documentation

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Hallucination | Medium | High | Strict grounding, confidence thresholds |
| Latency spikes | Low | Medium | Caching, fallbacks, rate limiting |
| Cost overrun | Medium | Medium | Budget alerts, usage caps |
| Poor quality | Low | High | Human review, continuous monitoring |

---

## Monitoring & Alerting

### Key Dashboards
- Real-time latency and error rates
- Query volume and patterns
- Cost tracking vs. budget
- Quality metrics (CTR, CSAT, accuracy)

### Alert Thresholds
- Latency: p95 >target for 5 minutes
- Errors: >2% failure rate
- Cost: 80% of daily budget consumed
- Quality: CSAT <3.5 or CTR <50%

