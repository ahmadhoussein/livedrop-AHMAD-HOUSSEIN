# livedrop-AHMAD-HOUSSEIN
README.md for Live Drops System Design
Live Drops - System Design Project
Project Name: livedrop-jason

Graph Link: https://excalidraw.com/#json=M8LGOKU5j_-nvKR0dCe05,Mnvre2y5pI0ehtiXNCO8UQ

🔹 Public APIs (Client-Facing)

These are exposed through the API Gateway to mobile/web clients.

1. Authentication & Users

POST /api/auth/register → Register a new user
Body: { name, email, password }

POST /api/auth/login → Login, returns JWT token

GET /api/users/:id → Get user profile

PUT /api/users/:id → Update profile

DELETE /api/users/:id → Delete account

2. Creators & Followers

POST /api/creators → Create/upgrade creator profile

GET /api/creators/:id → Get creator details

GET /api/creators → List all creators

POST /api/followers → Follow creator { userId, creatorId }

DELETE /api/followers → Unfollow creator

GET /api/creators/:id/followers → List followers

3. Products & Drops

POST /api/products → Create product (creator only)

GET /api/products/:id → Get product details

GET /api/creators/:id/products → List products of a creator

POST /api/drops → Create drop (creator only)

GET /api/drops?status=live|upcoming|ended → List drops by status

GET /api/drops/:id → Get drop details

4. Orders & Payments

POST /api/orders → Place new order { userId, dropId, productId, quantity }

GET /api/orders/:id → Get order details

GET /api/users/:id/orders → Get user’s orders

PUT /api/orders/:id/cancel → Cancel order

POST /api/payments → Initiate payment { orderId, amount, method }

GET /api/payments/:id → Get payment status

5. Notifications

GET /api/users/:id/notifications → Get notifications for user

PUT /api/notifications/:id/read → Mark as read

6. Real-Time (WebSocket/Push)

ws://.../push → Real-time events (drop started, low stock, sold out, order confirmed).

🔹 Internal APIs (Microservices Communication)

These are not public, used for service-to-service RPC/REST/Kafka.

1. Inventory Service

POST /internal/inventory/reserve
Body: { dropId, userId, quantity } → Reserve stock

POST /internal/inventory/release
Body: { reservationId } → Release reserved stock

POST /internal/inventory/confirm
Body: { reservationId } → Deduct from available stock

2. Payment Service

POST /internal/payments/charge
Body: { orderId, amount, method } → Charge via payment provider

POST /internal/payments/refund
Body: { paymentId } → Refund payment

3. Notification Service

POST /internal/notifications/send
Body: { userId, type, payload } → Send notification (push + save in DB)

4. Order Service

Communicates with Inventory and Payment services to ensure atomic ordering:

Reserve stock

Process payment

Confirm order & deduct inventory

Trigger notification

🔹 API Contract Principles

Authentication: JWT for all public APIs, internal APIs secured with service-to-service tokens.

Idempotency: Order creation & payment APIs use idempotency keys to prevent duplicates.

Response format: JSON { success, data, error }

Errors: Standardized error codes (400, 401, 403, 404, 409, 500).

⚡ This structure ensures:

Public APIs → clean, client-friendly.

Internal APIs → microservices can coordinate safely without exposing business logic.

System Design Explanation
This document outlines the system design for the "Live Drops" platform, a flash-sale and follow platform designed to handle high-traffic, limited-inventory product drops by creators. The approach is based on a 

microservices architecture to ensure scalability, resilience, and a clear separation of concerns. The attached diagram visually represents this design .

Architectural Approach and Key Components
The core of the system is a set of specialized microservices, each handling a specific domain to prevent bottlenecks and allow for independent scaling.


API Gateway & GraphQL: The API Gateway is the single point of entry for all client requests. By supporting both 

REST and GraphQL, it provides a flexible API for mobile and web clients. GraphQL is particularly useful for mobile devices with varying network conditions, as it allows clients to fetch exactly the data they need in a single request, reducing network calls and improving efficiency.


Load Balancer: Requests from the API Gateway are distributed by a load balancer to the appropriate application server instances. This ensures high availability and distributes the load evenly, which is crucial for handling the "celebrity" traffic spikes.

Microservices (App Server): The main logic is split into several services:

Authentication Service (AUTHEN SERV): Manages user registration and login, issuing access tokens for secure communication.


Followers Service (FOLLOWERS): Handles the complex logic of following and unfollowing creators. This service is designed to avoid bottlenecks for popular creators with millions of followers.






Products & Drops Services: These services manage the creation and scheduling of drops with limited stock. The Drops service is responsible for handling the lifecycle of a drop, from upcoming to live to ended.


Orders & Inventory Services: This is the most critical part of the system for handling flash sales. The 

Inventory Service manages stock and ensures that inventory never goes below zero, even with many concurrent orders. The 


Orders Service handles placing and managing orders.

Payment Service: Decoupled from the orders service to handle all payment-related logic.


Notifications Service: Responsible for sending real-time notifications to users about drop events, stock changes, and order confirmations.


Kafka: A message queue like Kafka is used as an event bus to enable asynchronous, event-driven communication between services. When a payment is confirmed or inventory changes, a message is published to Kafka. Services like 

Notifications can then subscribe to these events, ensuring a decoupled and scalable system.

Redis: Redis is used for caching and managing real-time data. It's ideal for storing frequently accessed views, such as product details, stock status, and creator profiles, to meet the low-latency read requirements of a p95 ≤200ms.


Database: The primary database stores authoritative data for all services, including products, drops, users, and orders.

S3 & CDN: All static assets, such as product images, are stored in a distributed object storage service like S3. A 

Content Delivery Network (CDN) then caches these assets at edge locations worldwide, drastically reducing latency for users and offloading traffic from the application servers.

Strategies for Addressing Key Requirements
No Overselling: The system prevents overselling by implementing a reserve-and-confirm pattern for inventory. When a user attempts to place an order, the system first atomically reserves the quantity of the item in the Inventory service. The stock is then decremented. Only after a successful payment is the reservation converted to a confirmed order. If payment fails, the reserved stock is released. This approach is more reliable than a simple decrement to handle concurrent order attempts.



Idempotency: Order placement is idempotent by using an Idempotency-Key header with each request. The Orders service checks if an order with that specific key has already been processed. If so, it returns the existing order details without creating a new one. This prevents duplicate orders from client retries.




Scalable Follower Lists: For creators with millions of followers, a simple GET request could lead to performance issues. The 

Followers Service is designed to use cursor-based pagination instead of traditional offset-based pagination. This prevents performance degradation as the list grows, ensuring consistent and deterministic results.




Real-Time Notifications: The Notifications Service communicates with the client via WebSockets for near real-time updates. Events like 

drop_started or sold_out are triggered by other services (e.g., Drops, Inventory) and sent as messages through Kafka. The Notifications service consumes these messages and pushes them to the connected clients within the 2-second delivery time requirement.
