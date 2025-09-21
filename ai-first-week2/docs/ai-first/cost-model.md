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
- Cache hit rate: 70% (progressive caching + deduplication may raise to 85%)

### Calculation
Cost/action = (150/1000 * 0.15) + (50/1000 * 0.60)  
= 0.0225 + 0.030 = **$0.0525**

Daily cost = 0.0525 * 50,000 * (1 - 0.70)  
= 0.0525 * 15,000 = **$787.5/day**

### Results
- Cost/action = $0.053  
- Daily = $787.5  
- Monthly ≈ $23,625  

**Break-even:** If AI improves conversion by 0.5% across 20k sessions/day with AOV $50 → +$5,000/day revenue. ROI positive.

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

**Break-even:** Avg human ticket cost $5. If AI resolves 70% of 1k tickets/day → saves $3,500/day vs $147/day AI cost.

---

## Total Costs
- Combined daily = **$934.5**  
- Combined monthly ≈ **$28,035**

**Scaling Projection (10x traffic):**  
- Search = $7,875/day  
- Support = $1,470/day  
- Total = $9,345/day (~$280k/month).  
Requires aggressive caching + tiered models.

---

## Cost Levers
- **Search**: reduce context (to 100 tokens), semantic dedup → cache hit >85%, downgrade to Llama 3.1 ($0.018/action).  
- **Support**: trim conversation history (500 tokens), use smaller model for FAQ, GPT-4o-mini only for complex queries.  
- Emergency mode: restrict AI search to logged-in users + extend TTL to 48h → drop costs < $300/day.
