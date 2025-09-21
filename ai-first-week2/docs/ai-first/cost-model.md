# Cost Model – ShopLite AI Features

## Executive Summary
This document provides detailed cost analysis for our two AI-enabled features. At current scale, total daily cost is **$934.50** with clear path to profitability through conversion improvements and support cost reduction.

---

## Model Selection & Pricing

### Selected Model
**GPT-4o-mini** via Azure OpenAI Service  
- Prompt tokens: $0.15 per 1K tokens  
- Completion tokens: $0.60 per 1K tokens  
- Commitment tier: 1M tokens/day for 20% discount (not yet applied)

### Alternative Models Evaluated
| Model          | Prompt $/1K | Completion $/1K | Notes                        |
|----------------|-------------|-----------------|------------------------------|
| GPT-4o-mini    | $0.15       | $0.60           | Selected - best quality/cost |
| Llama 3.1 8B   | $0.05       | $0.20           | Backup for low-risk queries  |
| Claude Haiku   | $0.25       | $1.25           | Too expensive for scale      |
| GPT-3.5-turbo  | $0.50       | $1.50           | Deprecated, lower quality    |

---

## Assumptions
- Search request: ~150 tokens in, 50 tokens out  
- Support request: ~800 tokens in, 150 tokens out  
- Search traffic: 50,000 requests/day  
- Support traffic: 1,000 requests/day  
- Search cache hit rate: 70%  
- Support cache hit rate: 30%  

---

## Calculations

### Cost per Action
**Search Suggestions**
Cost/action = (150/1000 × $0.15) + (50/1000 × $0.60)
= $0.0525

markdown
نسخ الكود

**AI Support Assistant**
Cost/action = (800/1000 × $0.15) + (150/1000 × $0.60)
= $0.210

markdown
نسخ الكود

### Daily Cost
**Search**
Daily cost = $0.0525 × 50,000 × (1 - 0.70)
= $787.50

markdown
نسخ الكود

**Support**
Daily cost = $0.210 × 1,000 × (1 - 0.30)
= $147.00

yaml
نسخ الكود

---

## Results
- **Search suggestions** → Cost/action = $0.053, Daily = $787.50  
- **Support assistant** → Cost/action = $0.210, Daily = $147.00  
- **Total Daily Cost = $934.50**

---

## Combined Cost Analysis

### Current Scale (September 2024)
| Feature            | Daily Requests | Cache Hit | Daily Cost | Monthly Cost |
|--------------------|----------------|-----------|------------|--------------|
| Search Suggestions | 50,000         | 70%       | $787.50    | $23,625      |
| Support Assistant  | 1,000          | 30%       | $147.00    | $4,410       |
| **Total**          | **51,000**     | -         | **$934.50**| **$28,035**  |

### Projected Scale (10x Growth - March 2025)
| Feature            | Daily Requests | Cache Hit | Daily Cost | Monthly Cost |
|--------------------|----------------|-----------|------------|--------------|
| Search Suggestions | 500,000        | 85%*      | $3,937.50  | $118,125     |
| Support Assistant  | 10,000         | 40%*      | $1,260.00  | $37,800      |
| **Total**          | **510,000**    | -         | **$5,197.50** | **$155,925** |

*Improved cache rates through optimization

---

## ROI Analysis
**Search**
Conversion improvement: +0.5%
Additional daily revenue = 20,000 × 0.005 × $50 = $5,000
Daily profit = $5,000 - $787.50 = $4,212.50
ROI = 535% ✓

markdown
نسخ الكود

**Support**
AI resolves 70% of 1,000 tickets = 700 tickets/day
Cost saved = 700 × $5 = $3,500
Daily profit = $3,500 - $147.00 = $3,353
ROI = 2,282% ✓

markdown
نسخ الكود

**Combined**
Total daily cost = $934.50
Total daily benefit ≈ $8,500
Payback = Immediate

yaml
نسخ الكود

---

## Cost Optimization Strategies

### Immediate (No Quality Impact)
1. Semantic Deduplication → -15% calls (~$4,200/month saved)  
2. Progressive Caching → +12% cache hits (~$6,700/month saved)  
3. Request Batching → -8% calls (~$2,200/month saved)  

### Medium-term (Minor Quality Tradeoff)
1. Hybrid Model Strategy (use Llama for simple queries) → ~$8,400 saved/month  
2. Context Reduction (shorter inputs) → ~$3,500 saved/month  
3. Smart Truncation (shorter history) → ~$880 saved/month  

### Emergency Controls
- Rate limiting (by user type)  
- Feature degradation (keyword fallback, template responses)  
- Traffic prioritization (premium vs free, region-based)  

---

## Budget Alerts & Monitoring

| Level      | Threshold           | Action                     |
|------------|---------------------|----------------------------|
| Info       | 50% daily budget    | Monitor closely            |
| Warning    | 70% daily budget    | Review traffic patterns    |
| Critical   | 85% daily budget    | Apply optimizations        |
| Emergency  | 100% daily budget   | Activate cost controls     |

- Development cap: $100/day  
- Staging cap: $500/day  
- Production cap: $2,000/day  

---

## Financial Projections (6-Month Outlook)

| Month     | Search Cost | Support Cost | Total Cost | Revenue Impact | Net Benefit |
|-----------|-------------|--------------|------------|----------------|-------------|
| Oct 2024  | $23,625     | $4,410       | $28,035    | $155,000       | $126,965    |
| Nov 2024  | $27,169     | $5,513       | $32,682    | $178,250       | $145,568    |
| Dec 2024  | $31,244     | $6,891       | $38,135    | $204,988       | $166,853    |
| Jan 2025  | $35,931     | $8,614       | $44,545    | $235,736       | $191,191    |
| Feb 2025  | $41,321     | $10,767      | $52,088    | $271,096       | $219,008    |
| Mar 2025  | $47,519     | $13,459      | $60,978    | $311,761       | $250,783    |

---

## Recommendations
- **Do Now:** Semantic deduplication, budget alerts, A/B conversion tests  
- **Next Quarter:** Azure commitment tier, hybrid model strategy, query classifier  
- **Next Year:** Fine-tune custom model, edge inference, self-hosting exploration  

---

## Appendix

### Cache TTL Model
```python
def calculate_optimal_ttl(query_frequency, storage_cost, api_cost):
    if query_frequency > 100:   # per hour
        return 86400            # 24 hours
    elif query_frequency > 10:
        return 3600             # 1 hour
    else:
        return 300              # 5 minutes
Token Estimation Formula
python
نسخ الكود
def estimate_tokens(text):
    return len(text) / 4   # ~1 token ≈ 4 characters
