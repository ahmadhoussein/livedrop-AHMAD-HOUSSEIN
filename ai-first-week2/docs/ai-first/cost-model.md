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
| Model | Prompt $/1K | Completion $/1K | Notes |
|-------|------------|-----------------|-------|
| GPT-4o-mini | $0.15 | $0.60 | Selected - best quality/cost |
| Llama 3.1 8B | $0.05 | $0.20 | Backup for low-risk queries |
| Claude Haiku | $0.25 | $1.25 | Too expensive for scale |
| GPT-3.5-turbo | $0.50 | $1.50 | Deprecated, lower quality |

---

## Feature 1: Smart Search Suggestions

### Token Estimation Methodology
```
Input tokens breakdown:
- User query: ~10 tokens
- Product context (5 items): ~100 tokens  
- System prompt: ~40 tokens
Total input: 150 tokens

Output tokens breakdown:
- Suggestions (5-8 items): ~40 tokens
- Formatting: ~10 tokens
Total output: 50 tokens
```

### Traffic Assumptions
- **Current**: 50,000 requests/day (20k sessions × 2.5 searches)
- **Peak hours**: 8,000 requests/hour (8am-10am, 7pm-9pm)
- **Growth projection**: 15% monthly

### Caching Strategy
- **Cache hit rate**: 70% (baseline)
- **Popular queries** (top 20%): 85% cache hit, 24h TTL
- **Long-tail queries** (bottom 80%): 60% cache hit, 1h TTL
- **Semantic deduplication**: Additional 10% reduction

### Cost Calculation

#### Per Request (Cache Miss)
```
Input cost = (150/1000) × $0.15 = $0.0225
Output cost = (50/1000) × $0.60 = $0.0300
Total per request = $0.0525
```

#### Daily Cost
```
Total requests = 50,000
Cache misses = 50,000 × (1 - 0.70) = 15,000
Daily cost = 15,000 × $0.0525 = $787.50
```

#### Monthly Projection
```
Monthly = $787.50 × 30 = $23,625
With 15% growth: Month 3 = $31,250
```

### ROI Analysis
- **Current conversion rate**: 2.0%
- **Expected improvement**: +0.5% (to 2.5%)
- **Average order value**: $50
- **Daily sessions**: 20,000

```
Additional daily revenue = 20,000 × 0.005 × $50 = $5,000
Daily profit = $5,000 - $787.50 = $4,212.50
ROI = 535% ✓
```

---

## Feature 2: AI Support Assistant

### Token Estimation Methodology
```
Input tokens breakdown:
- User message: ~50 tokens
- Conversation history (3 turns): ~300 tokens
- Retrieved FAQ context: ~300 tokens
- System prompt: ~150 tokens
Total input: 800 tokens

Output tokens breakdown:
- Response: ~120 tokens
- Formatting/citations: ~30 tokens
Total output: 150 tokens
```

### Traffic Assumptions
- **Current**: 1,000 requests/day
- **Peak hours**: 150 requests/hour (9am-11am)
- **Growth**: 25% monthly (word-of-mouth effect)

### Caching Strategy
- **Cache hit rate**: 30% (many unique order queries)
- **FAQ queries**: 45% cache hit
- **Order status**: 5% cache hit (too dynamic)
- **Template responses**: 50 queries use pre-written responses

### Cost Calculation

#### Per Request (Cache Miss)
```
Input cost = (800/1000) × $0.15 = $0.120
Output cost = (150/1000) × $0.60 = $0.090
Total per request = $0.210
```

#### Daily Cost
```
Total requests = 1,000
Cache misses = 1,000 × (1 - 0.30) = 700
Daily cost = 700 × $0.210 = $147.00
```

#### Monthly Projection
```
Monthly = $147.00 × 30 = $4,410
With 25% growth: Month 3 = $6,890
```

### ROI Analysis
- **Human ticket cost**: $5.00 per ticket
- **AI resolution rate**: 70%
- **Daily tickets**: 1,000

```
Tickets resolved by AI = 1,000 × 0.70 = 700
Daily savings = 700 × $5.00 = $3,500
Daily profit = $3,500 - $147.00 = $3,353
ROI = 2,282% ✓
```

---

## Combined Cost Analysis

### Current Scale (September 2024)
| Feature | Daily Requests | Cache Hit | Daily Cost | Monthly Cost |
|---------|---------------|-----------|------------|--------------|
| Search Suggestions | 50,000 | 70% | $787.50 | $23,625 |
| Support Assistant | 1,000 | 30% | $147.00 | $4,410 |
| **Total** | **51,000** | - | **$934.50** | **$28,035** |

### Projected Scale (10x Growth - March 2025)
| Feature | Daily Requests | Cache Hit | Daily Cost | Monthly Cost |
|---------|---------------|-----------|------------|--------------|
| Search Suggestions | 500,000 | 85%* | $3,937.50 | $118,125 |
| Support Assistant | 10,000 | 40%* | $1,260.00 | $37,800 |
| **Total** | **510,000** | - | **$5,197.50** | **$155,925** |

*Improved cache rates through optimization

---

## Cost Optimization Strategies

### Immediate Optimizations (No Quality Impact)
1. **Semantic Deduplication**
   - Group similar queries ("laptop", "laptops", "laptop computer")
   - Expected reduction: 15% of API calls
   - Monthly savings: ~$4,200

2. **Progressive Caching**
   - Popular queries: 48h TTL
   - Medium queries: 12h TTL  
   - Rare queries: 1h TTL
   - Expected cache hit improvement: 70% → 82%
   - Monthly savings: ~$6,700

3. **Request Batching**
   - Batch similar queries within 100ms window
   - Expected reduction: 8% of API calls
   - Monthly savings: ~$2,200

### Medium-term Optimizations (Minor Quality Tradeoff)
1. **Hybrid Model Strategy**
   ```
   if query_complexity < 0.3:
       use_model = "Llama 3.1 8B"  # 70% cheaper
   else:
       use_model = "GPT-4o-mini"
   ```
   - Expected savings: 40% on simple queries
   - Monthly savings: ~$8,400

2. **Context Reduction**
   - Reduce product context to 75 tokens
   - Reduce FAQ context to 200 tokens
   - Expected savings: 25% on input costs
   - Monthly savings: ~$3,500

3. **Smart Truncation**
   - Limit conversation history to 2 turns
   - Summarize long user messages
   - Expected savings: 20% on support costs
   - Monthly savings: ~$880

### Emergency Cost Controls
Implement if daily budget exceeded:

1. **Rate Limiting** (Immediate)
   - Non-authenticated: 10 searches/hour
   - Authenticated: 50 searches/hour
   - Support: 5 messages/conversation

2. **Feature Degradation** (Within 5 minutes)
   - Search: Fallback to keyword for 50% of queries
   - Support: Template responses for common questions
   - Extend all cache TTLs by 4x

3. **Traffic Prioritization** (Within 1 hour)
   - Premium customers: Full AI features
   - Free tier: Limited to trending/cached results
   - Geographic: Disable for low-revenue regions

---

## Budget Alerts & Monitoring

### Alert Thresholds
| Level | Threshold | Action |
|-------|-----------|--------|
| Info | 50% daily budget | Monitor closely |
| Warning | 70% daily budget | Review traffic patterns |
| Critical | 85% daily budget | Implement optimizations |
| Emergency | 100% daily budget | Activate cost controls |

### Daily Budget Caps
- Development: $100/day
- Staging: $500/day
- Production: $2,000/day (current 2x buffer)

### Cost Attribution
```python
# Tracking cost per feature/user segment
{
    "feature": "search",
    "user_segment": "premium",
    "timestamp": "2024-09-21T10:00:00Z",
    "tokens_in": 150,
    "tokens_out": 50,
    "cache_hit": false,
    "cost_usd": 0.0525
}
```

---

## Financial Projections

### 6-Month Outlook
| Month | Search Cost | Support Cost | Total Cost | Revenue Impact | Net Benefit |
|-------|------------|--------------|------------|----------------|-------------|
| Oct 2024 | $23,625 | $4,410 | $28,035 | $155,000 | $126,965 |
| Nov 2024 | $27,169 | $5,513 | $32,682 | $178,250 | $145,568 |
| Dec 2024 | $31,244 | $6,891 | $38,135 | $204,988 | $166,853 |
| Jan 2025 | $35,931 | $8,614 | $44,545 | $235,736 | $191,191 |
| Feb 2025 | $41,321 | $10,767 | $52,088 | $271,096 | $219,008 |
| Mar 2025 | $47,519 | $13,459 | $60,978 | $311,761 | $250,783 |

### Break-even Analysis
- **Search**: Profitable from Day 1 (ROI: 535%)
- **Support**: Profitable from Day 1 (ROI: 2,282%)
- **Combined**: $934.50 daily cost vs. $8,500 daily benefit
- **Payback period**: Immediate

---

## Recommendations

### Do Now
1. Implement semantic deduplication (Quick win: -15% costs)
2. Set up budget alerts and monitoring dashboards
3. Deploy A/B test to validate conversion improvements

### Do Next Quarter
1. Negotiate Azure commitment tier for 20% discount
2. Implement hybrid model strategy for simple queries
3. Build query quality classifier for intelligent routing

### Do Next Year
1. Fine-tune custom model on ShopLite data (-50% costs)
2. Implement edge inference for common queries
3. Explore self-hosted options for scale

---

## Appendix: Detailed Calculations

### Cache Hit Rate Optimization Model
```python
def calculate_optimal_ttl(query_frequency, storage_cost, api_cost):
    """
    Determines optimal TTL based on query patterns
    """
    if query_frequency > 100:  # per hour
        return 86400  # 24 hours
    elif query_frequency > 10:
        return 3600   # 1 hour
    else:
        return 300    # 5 minutes
```

### Token Estimation Formula
```python
def estimate_tokens(text):
    """
    Rough token estimation (1 token ≈ 4 characters)
    """
    return len(text) / 4
