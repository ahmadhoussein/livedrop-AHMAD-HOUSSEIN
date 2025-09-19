
[Uploading README.md…]()
# livedrop-AHMAD-HOUSSEIN

## 📑 Live Drops – System Design Project

### Project Overview
**Project Name:** livedrop-jason  
A flash-sale & follow platform where creators run limited-inventory product drops.  
Users can follow creators, browse products and drops, receive real-time notifications, and place orders during high-traffic events (including “celebrity” scenarios with millions of followers).

---

### 🔗 Graph Link
[Excalidraw Architecture Diagram](https://excalidraw.com/#json=7vfK3QScHviPkC2wF8_QZ,4Fh000YJ7ZJeKhXtKlV5Gw)

---

## 📂 Data Model Sketches 

### User/Authen
```sql
user (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```
- Users can be upgraded to creators.  
- 1–1 relation with creators.  

### Creators
```sql
creators (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ
)
```
- 1–M with products, drops.  

### Followers
```sql
followers (
  creator_id BIGINT REFERENCES creators(user_id),
  user_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ,
  PRIMARY KEY (creator_id, user_id)
)
```
- Composite PK prevents duplicates.  
- Cursor pagination supported via `(creator_id, created_at DESC)`.  

### Products
```sql
products (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT REFERENCES creators(user_id),
  name TEXT,
  description TEXT,
  price_cents BIGINT,
  image_url TEXT,
  created_at TIMESTAMPTZ
)
```

### Drops
```sql
drops (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT REFERENCES creators(user_id),
  product_id BIGINT REFERENCES products(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_stock INT,
  status TEXT CHECK (status IN ('upcoming','live','ended')),
  created_at TIMESTAMPTZ
)
```

### Inventory
```sql
inventory (
  id BIGSERIAL PRIMARY KEY,
  drop_id BIGINT UNIQUE REFERENCES drops(id),
  available_stock INT,
  reserved_stock INT,
  sold_stock INT,
  updated_at TIMESTAMPTZ
)
```

### Orders
```sql
orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  drop_id BIGINT REFERENCES drops(id),
  product_id BIGINT REFERENCES products(id),
  quantity INT,
  total_price_cents BIGINT,
  status TEXT CHECK (status IN ('pending','confirmed','cancelled','failed')),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ
)
```
- Unique index `(user_id, idempotency_key)` prevents duplicate orders.  

### Payments
```sql
payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE REFERENCES orders(id),
  amount_cents BIGINT,
  method TEXT,
  status TEXT CHECK (status IN ('initiated','successful','failed','refunded')),
  created_at TIMESTAMPTZ
)
```

### Notifications
```sql
notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  type TEXT,
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
)
```

---

## 🔹 Public APIs (Client-Facing)

### Users & Auth
- `POST /api/auth/register` – Register  
- `POST /api/auth/login` – Login (JWT)  
- `GET /api/users/:id` – Get profile  

### Creators & Followers
- `POST /api/creators` – Upgrade to creator  
- `GET /api/creators/:id` – Get creator details  
- `POST /api/followers` – Follow creator  
- `DELETE /api/followers` – Unfollow  

### Products & Drops
- `POST /api/products` – Create product  
- `GET /api/drops?status=live|upcoming|ended` – List drops  
- `GET /api/drops/:id` – Drop details  

### Orders & Payments
- `POST /api/orders` – Place order  
- `PUT /api/orders/:id/cancel` – Cancel order  
- `POST /api/payments` – Charge payment  
- `GET /api/payments/:id` – Payment status  

### Notifications
- `GET /api/users/:id/notifications` – Get notifications  

### Real-Time
- `ws://.../push` – Drop started, low stock, sold out, order confirmed  

---

## 🔹 Internal APIs (Service-to-Service)

- **Inventory Service** → `/internal/inventory/reserve`, `/release`, `/confirm`  
- **Payment Service** → `/internal/payments/charge`, `/refund`  
- **Notification Service** → `/internal/notifications/send`  
- **Orders Service** → Orchestrates inventory + payment + notifications  

---

## 🗄️ Caching & Invalidation Strategy

- **TTL-based** → User/creator profiles, product metadata  
- **Write-through / Write-around** → Browsing feeds, drops  
- **Event-driven (Kafka)** → Inventory & order status updates  
- **Selective eviction** → Only affected keys removed  

> Writes always go to DB, cache used for reads.  

---

## ⚖️ Tradeoffs & Reasoning

| Decision | Tradeoff | Reason |
|----------|----------|--------|
| **Microservices vs Monolith** | + Scalability, isolation <br> – More complexity | Celebrity-level spikes require independent scaling |
| **Hybrid DB (SQL + NoSQL)** | + Consistency for payments <br> – Ops overhead | ACID for orders/payments, NoSQL for followers/social graph |
| **Redis Caching** | + Low latency <br> – Risk of stale data | Reads must meet p95 ≤200ms |
| **Kafka Messaging** | + Decoupled, replay <br> – Ops overhead | Notifications must arrive ≤2s |
| **Consistency vs Availability** | + Prevent overselling <br> – Slight refresh delays | Strong consistency for inventory/orders |
| **API Protocols (REST + GraphQL + gRPC)** | + Client & service optimization <br> – Complexity | REST/GraphQL for clients, gRPC internal |
| **Realtime Notifications** | + Instant updates <br> – Stateful infra | Critical for drop lifecycle |
| **Idempotency Keys** | + Prevent duplicates <br> – Retry latency | Guarantees correctness under high load |

---

## 📊 Monitoring & Metrics

- **Prometheus + Grafana** dashboards  
- Track: request volume, latency, cache hit ratio, lock contention, follower list performance  
- Alerts: overselling attempts, Kafka lag, API errors  

---

## ✅ Key Guarantees

- **No Overselling** → Reserve–confirm inventory pattern  
- **Idempotency** → Prevent duplicate orders/payments  
- **Scalability** → Independent scaling of services  
- **Resilience** → Single instance failure tolerated  
- **Performance** → Reads ≤200ms, Orders ≤500ms, Notifications ≤2s  
