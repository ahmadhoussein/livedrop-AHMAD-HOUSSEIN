# AI Capability Map – ShopLite

| Capability              | Intent (user)                               | Inputs (this sprint)          | Risk 1–5 (tag) | p95 ms | Est. cost/action | Fallback                     | Data Readiness | Selected |
|--------------------------|---------------------------------------------|-------------------------------|----------------|--------|------------------|------------------------------|----------------|:-------:|
| Smart Search Suggestions | Find products faster (typo/semantic aware)  | Product catalog (~10k SKUs)   | 2              | 250    | $0.053           | Basic keyword search         | ✅ Data clean & API ready | ✅ |
| AI Support Assistant     | Get instant help with orders & policies     | FAQ markdown, order-status API| 3              | 1000   | $0.21            | Escalate to human agent      | ✅ FAQ + API exist | ✅ |
| Dynamic Descriptions     | Auto-generate product copy from specs       | Product specs, brand guidelines| 4             | 2000   | $0.045           | Static templates             | ❌ Needs structured specs | ❌ |
| Price Optimization       | Suggest competitive prices dynamically      | Sales history, competitor data| 5              | 5000   | $0.120           | Manual pricing rules         | ❌ Data fragmented | ❌ |
| Review Summary Generator | Condense customer reviews into highlights   | Customer reviews dataset      | 3              | 1500   | $0.025           | Show raw reviews             | ⚠️ Reviews exist but noisy | ❌ |

---

## Why these two
We selected **Smart Search Suggestions** and **AI Support Assistant** because they directly improve **conversion rates** (finding products faster, even with typos) and reduce **support tickets** (resolving repetitive queries instantly). Both are low-risk: they rely on existing structured assets (catalog, FAQ, order-status API). Latency targets (≤250ms and ≤1000ms) are feasible with Redis caching and efficient retrieval. Fallbacks (keyword search, human escalation) ensure graceful degradation. We deprioritized personalization and visual search due to data dependency and higher technical complexity in Sprint 1.
