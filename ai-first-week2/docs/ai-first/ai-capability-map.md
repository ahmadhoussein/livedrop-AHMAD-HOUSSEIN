# AI Capability Map – ShopLite

| Capability              | Intent (user)                               | Inputs (this sprint)          | Risk 1–5 (tag) | p95 ms | Est. cost/action | Fallback                     | Selected |
|--------------------------|---------------------------------------------|-------------------------------|----------------|--------|------------------|------------------------------|:-------:|
| Smart Search Suggestions | Find products faster (typo/semantic aware)  | Product catalog (~10k SKUs)   | 2              | 250    | $0.053           | Basic keyword search         | ✅ |
| AI Support Assistant     | Get instant help with orders & policies     | FAQ markdown, order-status API| 3              | 1000   | $0.21            | Escalate to human agent      | ✅ |
| Dynamic Descriptions     | Auto-generate product copy from specs       | Product specs, brand guidelines| 4             | 2000   | $0.045           | Static templates             | ❌ |
| Price Optimization       | Suggest competitive prices dynamically      | Sales history, competitor data| 5              | 5000   | $0.120           | Manual pricing rules         | ❌ |
| Review Summary Generator | Condense customer reviews into highlights   | Customer reviews dataset      | 3              | 1500   | $0.025           | Show raw reviews             | ❌ |

---

## Why these two
We selected **Smart Search Suggestions** and **AI Support Assistant** because they directly impact **conversion rate** (helping customers find products despite typos or vague terms) and **support ticket reduction** (automating routine inquiries). Both leverage existing assets (catalog, FAQ markdown, order-status API) with low integration risk. Latency targets (≤250ms and ≤1000ms) are achievable with caching and efficient retrieval. Fallbacks (keyword search, human escalation) ensure graceful degradation without hurting user experience.

