# Cost Model – ShopLite

---

## Assumptions
- Model: GPT-4o-mini ($0.15/1K prompt, $0.60/1K completion)
- Defaults: Support assistant = 1k req/day (30% cache hit), Search = 50k req/day (70% cache hit)

---

## Smart Search Suggestions

### Token Estimates
- In: 150  
- Out: 50  
- Requests/day: 50,000  
- Cache hit rate: 70%

### Calculation
Cost/action = (150/1000 * 0.15) + (50/1000 * 0.60)  
= 0.0225 + 0.030 = **$0.0525**

Daily cost = 0.0525 * 50,000 * (1 - 0.70)  
= 0.0525 * 15,000 = **$787.5/day**

### Results
- Cost/action = $0.053  
- Daily = $787.5  
- Monthly ≈ $23,625

---

## AI Support Assistant

### Token Estimates
- In: 800  
- Out: 150  
- Requests/day: 1,000  
- Cache hit rate: 30%

### Calculation
Cost/action = (800/1000 * 0.15) + (150/1000 * 0.60)  
= 0.12 + 0.09 = **$0.21**

Daily cost = 0.21 * 1,000 * (1 - 0.30)  
= 0.21 * 700 = **$147/day**

### Results
- Cost/action = $0.21  
- Daily = $147  
- Monthly ≈ $4,410

---

## Total Costs
- Combined daily = **$934.5**  
- Combined monthly ≈ **$28,035**

---

## Cost Levers
- **Search**: shorten context (to 100 tokens), boost cache to 85%, or downgrade model to Llama 3.1 ($0.018/action).  
- **Support**: limit history to 500 tokens, use tiered model (cheap model for FAQs, GPT-4o-mini for complex).  
- Emergency mode: restrict to logged-in users + long cache TTL → < $300/day.

