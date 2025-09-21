# Cost Model – ShopLite AI Features

## Assumptions
- Model: GPT-4o-mini at $0.15/1K prompt tokens, $0.60/1K completion tokens
- **Search suggestions:**
  - Avg tokens in: 150   Avg tokens out: 50
  - Requests/day: 50,000
  - Cache hit rate: 70% (apply miss cost only if caching is used)
- **Support assistant:**
  - Avg tokens in: 800   Avg tokens out: 150
  - Requests/day: 1,000
  - Cache hit rate: 30% (apply miss cost only if caching is used)

## Calculation
Cost/action = (tokens_in/1000 * prompt_price) + (tokens_out/1000 * completion_price)
Daily cost = Cost/action * Requests/day * (1 - cache_hit_rate)

**Search suggestions:**
Cost/action = (150/1000 * $0.15) + (50/1000 * $0.60) = $0.0525
Daily cost = $0.0525 * 50,000 * (1 - 0.70) = $787.50

**Support assistant:**
Cost/action = (800/1000 * $0.15) + (150/1000 * $0.60) = $0.210
Daily cost = $0.210 * 1,000 * (1 - 0.30) = $147.00

## Results
- Support assistant: Cost/action = $0.210, Daily = $147.00
- Search suggestions: Cost/action = $0.053, Daily = $787.50
- **Total Daily Cost = $934.50**

## Cost lever if over budget
- Shorten context to 100 tokens for search suggestions (saves ~$262/day)
- Use Llama 3.1 8B for simple support queries (saves ~$105/day)
- Increase cache hit rate to 50% for support (saves ~$29/day)
- Implement query deduplication to reduce redundant API calls
