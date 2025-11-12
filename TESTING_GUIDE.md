# Testing Guide - Week 5 Assignment

This guide shows you how to test all required functionality for the Week 5 assignment.

## Prerequisites

1. **Turn off AUTO_SEED** in Render environment variables so data persists
2. Get a test user email from your database (e.g., `demouser@example.com`)
3. Get a valid order ID from the admin panel (24-character MongoDB ObjectId)

## Part 1: Intent Detection Tests (Required: 7 Intents)

### Test Each Intent in the Support Assistant

Access the support assistant on your storefront at: https://livedrop-ahmad-houssein-storefront.vercel.app

#### 1. **policy_question** - Returns policy, shipping, warranties

Test queries:
- "What is your return policy?"
- "How long is the warranty?"
- "What are your shipping options?"
- "Can I get a refund?"
- "Do you offer free shipping?"

**Expected:**
- Intent: `policy_question`
- Response includes citation like `[Policy3.1]`
- Answer comes from `ground-truth.json`
- No function calls

#### 2. **order_status** - Order tracking queries

Test queries:
- "What's the status of order 691619293e71dd679f8b9501?" (use real order ID)
- "Track my order 691619293e71dd679f8b9501"
- "Where is my package?"
- "Show my orders for demouser@example.com" (NEW - email-based)

**Expected:**
- Intent: `order_status`
- Function called: `getOrderStatus` (for order ID) or `getCustomerOrders` (for email)
- Response shows order status, customer name, total, carrier, ETA
- For email queries: Shows list of all customer orders

#### 3. **product_search** - Product searches

Test queries:
- "search for webcam"
- "webcam" (just the product name)
- "show me headphones"
- "looking for laptop"
- "find phone case"

**Expected:**
- Intent: `product_search`
- Function called: `searchProducts`
- Response lists matching products with names, prices, categories

#### 4. **complaint** - Customer complaints/issues

Test queries:
- "I'm very disappointed with this service"
- "This product is broken and I'm angry"
- "Your customer service is terrible"
- "I want to file a complaint"

**Expected:**
- Intent: `complaint`
- Response is empathetic and apologetic
- Offers to help and asks for more details
- No function calls

#### 5. **chitchat** - Greetings, small talk

Test queries:
- "Hello"
- "Hi there"
- "How are you?"
- "Good morning"
- "What's up?"

**Expected:**
- Intent: `chitchat`
- Response is friendly and warm
- Redirects to support topics (products, orders, policies)
- No function calls

#### 6. **off_topic** - Unrelated to e-commerce

Test queries:
- "What's the weather like?"
- "Who won the World Cup?"
- "Tell me a joke"
- "What's the capital of France?"

**Expected:**
- Intent: `off_topic`
- Response politely declines and redirects to e-commerce topics
- No function calls

#### 7. **violation** - Abusive or inappropriate content

Test queries:
- "You're stupid"
- "I hate you"
- [Use mild profanity]

**Expected:**
- Intent: `violation`
- Response sets boundaries professionally
- Maintains professionalism
- No function calls

---

## Part 2: Identity Tests (CRITICAL)

### Test That Assistant NEVER Reveals AI Model

Test queries:
- "What's your name?"
- "Are you a robot?"
- "Are you AI?"
- "Who created you?"
- "What model are you?"
- "Are you ChatGPT?"

**Expected:**
- Should respond with assistant name from `prompts.yaml` (e.g., "Ahmad")
- Should reference company/role (e.g., "Ahmad Store Support Specialist")
- **MUST NEVER say:** "ChatGPT", "Claude", "Llama", "AI model", "language model", "OpenAI"

---

## Part 3: Function Calling Tests

### Test 3 Required Functions

#### Function 1: `getOrderStatus(orderId)`

**Test in Assistant:**
Query: "What's the status of order 691619293e71dd679f8b9501?"

**Expected Response:**
- Function executed: `getOrderStatus`
- Shows: Order ID, Status, Customer Name, Total, Carrier, Estimated Delivery

**Verify in Response JSON:**
```json
{
  "functionsExecuted": ["getOrderStatus"],
  "response": "📦 **Order Status Update**...",
  "intent": "order_status"
}
```

#### Function 2: `searchProducts(query, limit)`

**Test in Assistant:**
Query: "search for webcam"

**Expected Response:**
- Function executed: `searchProducts`
- Shows: List of matching products with names, prices, categories

**Verify in Response JSON:**
```json
{
  "functionsExecuted": ["searchProducts"],
  "intent": "product_search"
}
```

#### Function 3: `getCustomerOrders(email)`

**Test in Assistant:**
Query: "show my orders for demouser@example.com"

**Expected Response:**
- Function executed: `getCustomerOrders`
- Shows: Customer name, email, list of all their orders

**Verify in Response JSON:**
```json
{
  "functionsExecuted": ["getCustomerOrders"],
  "intent": "order_status"
}
```

---

## Part 4: Citation Validation Tests

### Test Knowledge Base Grounding

**Test Query:**
"What is your return policy?"

**Expected Response:**
- Answer from `ground-truth.json`
- Contains citation like `[Policy3.1]` or `[Returns1.1]`

**Verify in Response JSON:**
```json
{
  "citations": ["Policy3.1"],
  "citationValidation": {
    "isValid": true,
    "validCitations": ["Policy3.1"],
    "invalidCitations": []
  }
}
```

**Check in ground-truth.json:**
- Open `docs/ground-truth.json`
- Verify `Policy3.1` exists
- Verify the answer matches the policy

---

## Part 5: API Endpoint Tests

### Test All Required Endpoints

#### Customers (No Auth Required)

```bash
# Get customer by email
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/customers?email=demouser@example.com"

# Get customer by ID
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/customers/YOUR_CUSTOMER_ID"
```

**Expected:** Returns customer object with name, email, phone, address

#### Products

```bash
# List products
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/products?limit=10"

# Search products
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/products?search=webcam"

# Get single product
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/products/YOUR_PRODUCT_ID"
```

**Expected:** Returns product array or single product

#### Orders

```bash
# Get order by ID
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/orders/691619293e71dd679f8b9501"

# Get orders for customer
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/orders?customerId=YOUR_CUSTOMER_ID"
```

**Expected:** Returns order(s) with items, total, status

#### Analytics (MUST Use Database Aggregation)

```bash
# Daily revenue
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/analytics/daily-revenue?from=2025-01-01&to=2025-12-31"

# Dashboard metrics
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/analytics/dashboard-metrics"
```

**Expected:** Returns aggregated data (revenue, order counts by date)

**Verify:** Check that `analytics.js` uses MongoDB `aggregate()` NOT JavaScript loops

---

## Part 6: Server-Sent Events (SSE) Test

### Test Real-Time Order Status Updates

**How to Test:**

1. Go to: https://livedrop-ahmad-houssein-storefront.vercel.app/order-status-sse
2. Enter a valid order ID from the admin panel
3. Click "Track Order"

**Expected Behavior:**
- Immediately shows current order status
- Every 3-7 seconds, status automatically updates:
  - `PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED`
- Status badge changes color
- Timeline shows progression
- Connection closes when `DELIVERED`
- **Database is updated** with each status change

**Manual Test via curl:**

```bash
curl -N "https://livedrop-ahmad-houssein-3gny.onrender.com/api/orders/YOUR_ORDER_ID/stream"
```

**Expected Output:**
```
data: {"status":"PENDING","timestamp":"2025-01-15T10:00:00Z"}

data: {"status":"PROCESSING","timestamp":"2025-01-15T10:00:05Z"}

data: {"status":"SHIPPED","timestamp":"2025-01-15T10:00:12Z"}

data: {"status":"DELIVERED","timestamp":"2025-01-15T10:00:19Z"}
```

---

## Part 7: Admin Dashboard Tests

### Test Dashboard Metrics

**Access:** https://livedrop-ahmad-houssein-storefront.vercel.app/admin

**Expected Sections:**

#### 1. Business Metrics
- Total Revenue (should match sum of all orders)
- Total Orders (count)
- Total Customers (count)
- Average Order Value (revenue / orders)

#### 2. Recent Orders Table
- Shows last 5 orders
- **Full 24-character order ID** displayed (not just last 8 chars)
- Customer name
- Total amount
- Status badge (colored by status)
- Date

#### 3. Top Products
- Top 5 products by sales
- Shows quantity sold and revenue

#### 4. Performance Metrics
- API Average Latency
- Requests per Minute
- Active SSE Connections

#### 5. Assistant Statistics
- Total Queries
- Average Response Time
- Function Calls Count

**Verify Data is Real:**
- Check that numbers match your database
- Not hardcoded values

---

## Part 8: Integration Tests (End-to-End)

### Test 1: Complete Purchase to Tracking Flow

1. **Browse products** - Visit storefront
2. **View product details** - Click on a product
3. **Check order in admin** - Go to admin panel, copy full order ID
4. **Track via SSE** - Go to SSE tracking page, paste order ID
5. **Watch live updates** - See status progress automatically
6. **Ask assistant** - In support chat: "What's the status of order [ID]?"
7. **Verify function called** - Check response shows function was executed

### Test 2: Support Interaction Flow

1. **Greet assistant** - "Hello"
2. **Ask policy** - "What is your return policy?"
3. **Verify citation** - Check response has `[PolicyID]`
4. **Search product** - "search for webcam"
5. **Check order by email** - "show my orders for demouser@example.com"
6. **Complain** - "I'm not happy with my order"
7. **Verify empathy** - Check response is apologetic

### Test 3: Multi-Intent Conversation

Have a conversation that uses all 7 intents:
1. "Hi there" (chitchat)
2. "search for laptop" (product_search)
3. "what's your warranty policy?" (policy_question)
4. "check order 691619293e71dd679f8b9501" (order_status)
5. "I'm very disappointed" (complaint)
6. "what's the weather?" (off_topic)
7. [mild profanity] (violation)

**Verify:** Each message gets correct intent and appropriate response

---

## Part 9: Database Seeding Verification

### Check Database Has Required Data

**Required:**
- 20-30 products
- 10-15 customers (including documented test user)
- 15-20 orders

**How to Check:**

1. **Admin Dashboard** - Shows counts at top
2. **MongoDB Compass** - Connect and check collections
3. **API Calls:**

```bash
# Count products
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/products?limit=100" | grep -o "\"_id\"" | wc -l

# Count customers via analytics
curl "https://livedrop-ahmad-houssein-3gny.onrender.com/api/analytics/dashboard-metrics"
```

**Verify Test User:**
- Check README.md has documented test user email
- Test user should have 2-3 orders

---

## Part 10: Configuration Files Verification

### Check Required Files Exist

1. **`docs/prompts.yaml`** - Assistant identity and intents
2. **`docs/ground-truth.json`** - 10-15 policies with unique IDs
3. **`docs/deployment-guide.md`** - Setup instructions
4. **`.env.example`** - Environment variables template
5. **`README.md`** - Test user documented

### Verify prompts.yaml Structure

```yaml
assistant:
  name: "Ahmad"  # NOT "ChatGPT" or "AI"
  role: "Support Specialist"
  company: "Ahmad Store"
  personality:
    - friendly
    - helpful
    - professional

intents:
  policy_question:
    behavior: "Ground on knowledge base"
  # ... all 7 intents
```

### Verify ground-truth.json Structure

- At least 10-15 policy documents
- Each has: `id`, `question`, `answer`, `category`, `lastUpdated`
- PolicyIDs are unique (e.g., "Policy3.1", "Shipping2.1")

---

## Quick Test Checklist

Use this for rapid verification:

### Backend & Database
- [ ] API deployed and accessible
- [ ] Database has 20+ products
- [ ] Database has 10+ customers
- [ ] Database has 15+ orders
- [ ] Test user documented in README

### Intents (All 7)
- [ ] policy_question works
- [ ] order_status works (both order ID and email)
- [ ] product_search works
- [ ] complaint works
- [ ] chitchat works
- [ ] off_topic works
- [ ] violation works

### Identity
- [ ] Has name (not ChatGPT/Llama)
- [ ] Never reveals AI model
- [ ] Responds naturally to "Are you AI?"

### Functions (All 3)
- [ ] getOrderStatus(orderId) works
- [ ] searchProducts(query, limit) works
- [ ] getCustomerOrders(email) works

### Citations
- [ ] Policy responses include [PolicyID]
- [ ] Citations validated against ground-truth.json
- [ ] Invalid citations flagged

### SSE
- [ ] Auto-status progression works
- [ ] UI updates in real-time
- [ ] Database gets updated
- [ ] Connection closes when DELIVERED

### Admin Dashboard
- [ ] Business metrics displayed
- [ ] Performance metrics displayed
- [ ] Assistant stats displayed
- [ ] Full order IDs shown
- [ ] Charts/visualizations present

### Configuration
- [ ] prompts.yaml exists and loaded
- [ ] ground-truth.json has 10-15 policies
- [ ] deployment-guide.md exists
- [ ] .env.example exists
- [ ] No secrets in git

---

## Troubleshooting

### Issue: Order IDs keep changing
**Solution:** Turn off AUTO_SEED in Render environment

### Issue: Assistant says "ChatGPT" or reveals model
**Solution:** Update prompts.yaml identity and add rules about what not to say

### Issue: Functions not being called
**Solution:** Check intent classification first, then check function registry

### Issue: SSE doesn't update
**Solution:** Check browser console for errors, verify SSE endpoint returns proper headers

### Issue: Citations not validating
**Solution:** Verify PolicyIDs in response match IDs in ground-truth.json exactly

---

## Testing URLs

- **Storefront:** https://livedrop-ahmad-houssein-storefront.vercel.app
- **Admin Dashboard:** https://livedrop-ahmad-houssein-storefront.vercel.app/admin
- **Order Tracking (SSE):** https://livedrop-ahmad-houssein-storefront.vercel.app/order-status-sse
- **API Base:** https://livedrop-ahmad-houssein-3gny.onrender.com/api
- **Support Assistant:** On storefront (bottom right)

---

## Test User Credentials

**Email:** demouser@example.com
**Orders:** Check admin panel for this user's order IDs
**Usage:** Use this email for testing customer order lookups
