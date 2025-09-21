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

   * Normalize query (lowercase, remove special chars)
   * Typo correction via edit distance ("iphon" → "iPhone")
   * Semantic expansion ("laptop" → includes "notebook, computer")
5. **Vector Search**: Query embeddings against pgvector index
6. **Ranking**: Combine semantic score (0.7) + popularity (0.2) + inventory (0.1)
7. **Response Format**: Return 5-8 suggestions with product thumbnails
8. **User Selection**: Click redirects to product page
9. **Analytics**: Log query, results, selection for model improvement
10. **Cache Update**: Store successful query-result pairs

### Grounding & Guardrails

* **Source of Truth**: Product catalog API (10k SKUs, updated hourly)
* **Retrieval Scope**: 100 tokens per product, 384-dim embeddings, similarity ≥0.65, max 8 results
* **Out-of-Scope Handling**: Category redirects, profanity filter, trending fallback

### Human-in-the-Loop

* Escalation triggers: confidence <0.3, zero results, 5+ failures in session, negative feedback
* Review by merchandising team weekly, adjustments applied

### Latency Budget

| Component           | Budget          |
| ------------------- | --------------- |
| Debounce            | 300ms           |
| Network             | 20ms            |
| Cache lookup        | 30ms            |
| Semantic processing | 50ms            |
| Vector search       | 100ms           |
| Ranking             | 30ms            |
| Response formatting | 15ms            |
| Network return      | 5ms             |
| **Total**           | **250ms (p95)** |

### Error & Fallback Behavior

* Timeout → fallback to keyword search
* API failure → cached results
* Redis down → DB query
* Total failure → category browse

### PII Handling

* Strip emails/phones, anonymize sessions, retain logs 30 days, GDPR deletion supported

### Success Metrics

* **Product Metric 1**: Click-Through Rate (CTR) = Clicks ÷ Impressions (Target >65%)
* **Product Metric 2**: Query Success Rate = Successful searches ÷ Total searches (Target >95%)
* **Business Metric**: Search-to-Cart Rate = Add-to-cart ÷ Search sessions (Target +15%)

---

## 2. AI Support Assistant

### Problem Statement

Support tickets average 4-hour response time with 60% being repetitive queries. Human agents handle 1,000 tickets daily at \$5/ticket cost. The AI assistant will resolve 70% instantly, reducing costs by \$3,500/day and improving CSAT.

### Happy Path Flow

1. User opens chat widget
2. Intent classified (order, policy, product, other)
3. Redis cache check
4. Context retrieval: FAQ embeddings, Order API, Product catalog
5. GPT-4o-mini generates response with context
6. Confidence check (threshold 0.8)
7. Response streamed to user
8. Feedback prompt (thumbs up/down)
9. Conversation logged
10. Session context kept 30 min

### Grounding & Guardrails

* **Source of Truth**: FAQ markdown, Order API, Product catalog
* **Refusals**: Legal, medical, pricing, sensitive account changes → escalate

### Human-in-the-Loop

* Escalate if confidence <0.8, flagged keywords, anger/distress detected, high-value transactions, or explicit human request
* Agent handoff preserves context

### Latency Budget

| Component             | Budget           |
| --------------------- | ---------------- |
| Message receive       | 10ms             |
| Intent classification | 50ms             |
| Cache lookup          | 50ms             |
| Context retrieval     | 200ms            |
| Model inference       | 400ms            |
| Formatting            | 100ms            |
| Scoring               | 50ms             |
| Delivery              | 40ms             |
| Logging               | 100ms            |
| **Total**             | **1000ms (p95)** |

### Error & Fallback Behavior

* Timeout → template response + escalate
* API unreachable → cached/general answer
* High load → queue with ETA
* Context fail → immediate escalation

### Error Investigation Process

To ensure continuous improvement, every error or escalation will be investigated using a structured process:

1. **Log Capture**: Record full details of the failed request (timestamp, query, context retrieved, system response).
2. **Root Cause Analysis**: Identify if the error was due to missing data, ambiguous intent, API failure, or model misinterpretation.
3. **Classification**: Tag errors by type (data gap, infrastructure, model, UX).
4. **Remediation Plan**: Propose fixes such as updating FAQ data, improving intent classification, adding API retries, or refining model prompts.
5. **Tracking**: Maintain an error backlog with priority and ownership.
6. **Review Cycle**: Weekly triage meetings to review patterns, assign tasks, and measure error reduction over time.

### PII Handling

* Mask order IDs/names, encrypt at rest, retain 60 days then anonymize, GDPR-compliant

### Success Metrics

* **Product Metric 1**: Resolution Rate = AI resolved ÷ Total queries (Target 70%)
* **Product Metric 2**: Avg Handle Time = Total handling time ÷ Conversations (Target <90s)
* **Business Metric**: Cost per Resolution = Total cost ÷ AI resolutions (Target <\$0.50)

---

## Implementation Roadmap

* **Week 1**: Embedding pipeline, Redis, telemetry
* **Week 2**: Deploy Smart Search (10%), Support Assistant shadow mode
* **Week 3**: Tune parameters, add caching, fallback mechanisms
* **Week 4**: Scale to 50%, anomaly alerts, handoff docs

---

## Risk Mitigation

| Risk           | Probability | Impact | Mitigation                   |
| -------------- | ----------- | ------ | ---------------------------- |
| Hallucination  | Medium      | High   | Strict grounding, thresholds |
| Latency spikes | Low         | Medium | Caching, fallbacks           |
| Cost overrun   | Medium      | Medium | Usage caps, budget alerts    |
| Poor quality   | Low         | High   | Human review, monitoring     |

---

## Monitoring & Alerting

* **Dashboards**: Latency, errors, query volume, cost vs budget, CTR/CSAT
* **Alerts**: p95 latency >target, error >2%, cost >80% budget, CSAT <3.5
