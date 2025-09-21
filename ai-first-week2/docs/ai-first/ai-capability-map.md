# AI Capability Map – ShopLite

## Overview

This document outlines potential AI capabilities for ShopLite's e-commerce platform, evaluated across implementation complexity, business impact, and technical feasibility. We've selected two high-impact, low-risk capabilities for Sprint 1.

## ShopLite Baseline
- **SKUs**: ~10k products in catalog
- **Daily sessions**: ~20k users/day  
- **Search requests**: 50k/day (avg 2.5 searches per session)
- **Support requests**: 1k/day (5% of sessions require support)
- **Existing infrastructure**: FAQ markdown, order-status API, product catalog API

---

## Capability Assessment Matrix

| Capability | Intent (user) | Inputs (this sprint) | Risk 1-5 | p95 ms | Est. cost/action | Fallback | Selected |
|---|---|---|---:|---:|---|---|:---:|
| **Smart Search Suggestions** | Find products faster with typo/semantic awareness | Product catalog (~10k SKUs), search logs | 2 | 250 | $0.053 | Basic keyword search | ✅ |
| **AI Support Assistant** | Get instant help with orders & policies | FAQ markdown, order-status API | 3 | 800 | $0.210 | Escalate to human agent | ✅ |
| Dynamic Descriptions | Auto-generate compelling product copy | Product specs, brand guidelines | 4 | 2000 | $0.045 | Static templates | ❌ |
| Visual Search | Find products using image uploads | Product images, visual embeddings | 4 | 3000 | $0.082 | Text search only | ❌ |
| Price Optimization | Suggest competitive prices dynamically | Sales history, competitor data | 5 | 5000 | $0.120 | Manual pricing rules | ❌ |
| Review Summarization | Condense reviews into key insights | Customer reviews dataset | 3 | 1500 | $0.025 | Show raw reviews | ❌ |

---

## Why These Two

We selected **Smart Search Suggestions** and **AI Support Assistant** based on immediate business impact and low integration risk. Search improvements directly boost conversion rates (estimated +0.5-1.0%), while automated support reduces operational costs by ~40% and improves response times from hours to seconds. Both leverage existing, clean data sources (product catalog API, FAQ documentation, order-status API) with clear fallback mechanisms that ensure zero service disruption. These capabilities deliver measurable ROI within Sprint 1's 4-week timeline while creating a foundation for future AI expansion.
