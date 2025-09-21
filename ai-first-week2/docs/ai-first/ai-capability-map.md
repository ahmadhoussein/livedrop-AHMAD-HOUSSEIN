# AI Capability Map – ShopLite

## Overview

This document outlines potential AI capabilities for ShopLite's e-commerce platform, evaluated across implementation complexity, business impact, and technical feasibility. We've selected two high-impact, low-risk capabilities for Sprint 1.

---

## Capability Assessment Matrix

| Capability                   | Intent (user)                                     | Inputs (this sprint)                      | Risk 1–5 | p95 ms | Est. cost/action | Fallback                | Data Readiness           | Selected |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------- | -------- | ------ | ---------------- | ----------------------- | ------------------------ | :------: |
| **Smart Search Suggestions** | Find products faster with typo/semantic awareness | Product catalog (\~10k SKUs), search logs | 2        | 250    | \$0.053          | Basic keyword search    | ✅ Catalog API ready      |     ✅    |
| **AI Support Assistant**     | Get instant help with orders & policies           | FAQ markdown, order-status API            | 3        | 800\*  | \$0.210          | Escalate to human agent | ✅ FAQ + API exist        |     ✅    |
| Dynamic Descriptions         | Auto-generate compelling product copy             | Product specs, brand guidelines           | 4        | 2000   | \$0.045          | Static templates        | ⚠️ Specs need structure  |     ❌    |
| Visual Search                | Find products using image uploads                 | Product images, visual embeddings         | 4        | 3000   | \$0.082          | Text search only        | ❌ No image pipeline      |     ❌    |
| Price Optimization           | Suggest competitive prices dynamically            | Sales history, competitor data            | 5        | 5000   | \$0.120          | Manual pricing rules    | ❌ Data fragmented        |     ❌    |
| Review Summarization         | Condense reviews into key insights                | Customer reviews dataset                  | 3        | 1500   | \$0.025          | Show raw reviews        | ⚠️ Reviews noisy         |     ❌    |
| Personalized Recommendations | Surface relevant products per user                | User behavior, purchase history           | 3        | 500    | \$0.035          | Trending products       | ❌ GDPR compliance needed |     ❌    |
| Inventory Forecasting        | Predict stock needs using ML                      | Historical sales, seasonal data           | 4        | 8000   | \$0.095          | Manual reorder points   | ⚠️ 6 months data only    |     ❌    |

> \*Note: Target latency for the **AI Support Assistant** is set to \~800ms (p95). While this is higher than Smart Search Suggestions (250ms), it remains within "sub-second" response time and is acceptable due to external API calls (order-status) and FAQ embedding retrieval. This aligns with the RFC, which specifies ≤1000ms for support use cases.

### Risk Classification

* **1-2**: Low risk - Proven patterns, clear fallbacks
* **3**: Medium risk - Some complexity, manageable edge cases
* **4-5**: High risk - Technical uncertainty, data dependencies

---

## Why These Two Capabilities

We selected **Smart Search Suggestions** and **AI Support Assistant** based on three critical factors:

1. **Immediate Business Impact**: Search improvements directly boost conversion rates (estimated +0.5-1.0%), while automated support reduces operational costs by \~40% and improves response times from hours to seconds.

2. **Technical Readiness**: Both leverage existing, clean data sources (product catalog API, FAQ documentation, order-status API) with no additional data engineering required. Infrastructure components (Redis, pgvector) are already deployed.

3. **Risk Mitigation**: Clear fallback mechanisms ensure zero service disruption. Search degrades gracefully to keyword matching; support escalates seamlessly to human agents. Both maintain sub-second latency targets achievable with current architecture.

These capabilities create a foundation for future AI expansion while delivering measurable ROI within Sprint 1's 4-week timeline.

---

## Deferred Capabilities Rationale

### Near-term (Sprint 2)

* **Review Summarization**: Requires data cleaning and sentiment analysis pipeline
* **Dynamic Descriptions**: Needs structured product attributes and brand voice training

### Long-term (Q2 2025)

* **Visual Search**: Requires image processing infrastructure and embedding generation
* **Price Optimization**: Complex competitive intelligence and margin analysis needed
* **Personalized Recommendations**: GDPR compliance and user consent framework required
* **Inventory Forecasting**: Needs 12+ months of seasonal data for accuracy

---

## Success Criteria

### Sprint 1 Goals

* Deploy both capabilities to 10% of traffic by Week 3
* Achieve target latencies (Search <250ms, Support <800ms) at p95
* Maintain AI costs under \$1,000/day at current scale
* Zero critical failures in fallback scenarios

### Measurement Framework

* **Search**: Click-through rate, query-to-purchase rate, abandonment reduction
* **Support**: Ticket deflection rate, CSAT scores, average handle time
* **Platform**: API latency, cache hit rates, error rates <1%

---

## Next Steps

1. **Week 1**: Build embedding pipeline for 500 high-traffic SKUs
2. **Week 2**: Implement Redis caching layer with semantic deduplication
3. **Week 3**: Deploy A/B test framework with 10% rollout
4. **Week 4**: Scale to 50% traffic based on metrics

> **Timeline Alignment:** Sprint 1 (4 weeks) is part of the broader RFC timeline (Phase 3: AI-first sprint). This ensures consistency: the platform is production-ready "in weeks, not months," while still fitting into the overall 18-week phased rollout plan.
