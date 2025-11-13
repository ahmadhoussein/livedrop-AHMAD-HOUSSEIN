# System Flow Documentation - توثيق سير عمل النظام

Complete end-to-end flow explanation of Ahmad Store e-commerce platform.

شرح كامل من البداية إلى النهاية لمنصة أحمد ستور للتجارة الإلكترونية.

---

## Part 1: Backend API Flow - سير عمل الواجهة الخلفية API

### English

**How it works:**

1. **Server Startup** (`apps/api/src/server.js`)
   - Express server starts on port 3001 (or Render's port)
   - Connects to MongoDB Atlas using connection string from `.env`
   - Registers all route handlers (products, orders, customers, analytics, assistant)
   - Starts listening for HTTP requests

2. **Database Connection** (`apps/api/src/db.js`)
   - Uses MongoDB Node.js driver
   - Connection string format: `mongodb+srv://user:password@cluster.mongodb.net/database`
   - Maintains single connection pool for all requests
   - Handles connection errors and retries

3. **Request Flow** (Example: Getting products)
   ```
   Client Request
   ↓
   Express Router (/api/products)
   ↓
   Route Handler (apps/api/src/routes/products.js)
   ↓
   MongoDB Query (db.collection('products').find())
   ↓
   Response Processing (format data)
   ↓
   JSON Response to Client
   ```

4. **Key Endpoints:**

   **Products:**
   - `GET /api/products` - List all products with pagination
   - `GET /api/products/:id` - Get single product
   - `GET /api/products?search=webcam` - Search products
   - Query → MongoDB find with regex → Return results

   **Orders:**
   - `POST /api/orders` - Create new order
   - Validate input → Insert to MongoDB → Return order ID
   - `GET /api/orders/:id` - Get order by ID
   - Query MongoDB by _id → Return order details

   **Customers:**
   - `GET /api/customers?email=user@example.com` - Find customer by email
   - Query MongoDB by email field → Return customer data
   - Used for simple identification (no passwords)

   **Analytics:**
   - `GET /api/analytics/daily-revenue` - Get revenue by day
   - Uses MongoDB **aggregation pipeline** (NOT JavaScript loops)
   - Groups orders by date, sums totals
   - Returns array of {date, revenue, orderCount}

### العربية

**كيف يعمل:**

1. **بدء تشغيل الخادم** (`apps/api/src/server.js`)
   - يبدأ خادم Express على المنفذ 3001 (أو منفذ Render)
   - يتصل بـ MongoDB Atlas باستخدام سلسلة الاتصال من `.env`
   - يسجل جميع معالجات المسارات (المنتجات، الطلبات، العملاء، التحليلات، المساعد)
   - يبدأ الاستماع لطلبات HTTP

2. **اتصال قاعدة البيانات** (`apps/api/src/db.js`)
   - يستخدم MongoDB Node.js driver
   - تنسيق سلسلة الاتصال: `mongodb+srv://user:password@cluster.mongodb.net/database`
   - يحتفظ بمجموعة اتصالات واحدة لجميع الطلبات
   - يعالج أخطاء الاتصال ويعيد المحاولة

3. **تدفق الطلب** (مثال: الحصول على المنتجات)
   ```
   طلب العميل
   ↓
   موجه Express (/api/products)
   ↓
   معالج المسار (apps/api/src/routes/products.js)
   ↓
   استعلام MongoDB (db.collection('products').find())
   ↓
   معالجة الاستجابة (تنسيق البيانات)
   ↓
   استجابة JSON للعميل
   ```

4. **النقاط الرئيسية:**

   **المنتجات:**
   - `GET /api/products` - قائمة جميع المنتجات مع الترقيم
   - `GET /api/products/:id` - الحصول على منتج واحد
   - `GET /api/products?search=webcam` - البحث عن المنتجات
   - الاستعلام → MongoDB find مع regex → إرجاع النتائج

   **الطلبات:**
   - `POST /api/orders` - إنشاء طلب جديد
   - التحقق من الإدخال → الإدراج في MongoDB → إرجاع معرف الطلب
   - `GET /api/orders/:id` - الحصول على الطلب بالمعرف
   - استعلام MongoDB بـ _id → إرجاع تفاصيل الطلب

   **العملاء:**
   - `GET /api/customers?email=user@example.com` - البحث عن عميل بالبريد الإلكتروني
   - استعلام MongoDB بحقل البريد الإلكتروني → إرجاع بيانات العميل
   - يستخدم للتعريف البسيط (بدون كلمات مرور)

   **التحليلات:**
   - `GET /api/analytics/daily-revenue` - الحصول على الإيرادات حسب اليوم
   - يستخدم **خط أنابيب التجميع** في MongoDB (وليس حلقات JavaScript)
   - يجمع الطلبات حسب التاريخ، ويجمع الإجماليات
   - يعيد مصفوفة من {التاريخ، الإيرادات، عدد الطلبات}

---

## Part 2: Server-Sent Events (SSE) Flow - تدفق الأحداث المرسلة من الخادم

### English

**What is SSE?**
- Server-Sent Events = Server pushes updates to client in real-time
- One-way communication (server → client)
- Uses HTTP (not WebSocket)
- Perfect for live order tracking

**Complete Flow:**

1. **Client Opens Connection**
   ```
   User enters order ID on /order-status-sse page
   ↓
   Frontend creates EventSource('/api/orders/[ID]/stream')
   ↓
   Browser keeps connection open
   ```

2. **Server Handles Connection** (`apps/api/src/sse/order-status.js`)
   ```
   Request received
   ↓
   Set SSE headers:
     Content-Type: text/event-stream
     Cache-Control: no-cache
     Connection: keep-alive
   ↓
   Query MongoDB for order
   ↓
   Send current status immediately
   ↓
   Start auto-simulation loop
   ```

3. **Auto-Simulation Loop** (Every 3-7 seconds)
   ```
   Check current status
   ↓
   If PENDING → Update to PROCESSING
   If PROCESSING → Update to SHIPPED
   If SHIPPED → Update to DELIVERED
   ↓
   Update MongoDB database
   ↓
   Send SSE event to client
   ↓
   If DELIVERED → Close connection
   Otherwise → Wait and repeat
   ```

4. **SSE Event Format**
   ```
   data: {"status":"PROCESSING","timestamp":"2025-01-15T10:00:00Z"}

   ```
   - Must have "data: " prefix
   - Must end with double newline
   - Client receives and parses JSON

5. **Client Updates UI** (`apps/storefront/src/pages/order-status-sse.tsx`)
   ```
   EventSource receives message
   ↓
   Parse JSON data
   ↓
   Update status badge color
   ↓
   Update timeline progress
   ↓
   Update carrier/ETA info
   ↓
   If DELIVERED → Close EventSource
   ```

6. **Error Handling**
   - Client disconnects → Server cleans up interval
   - Network error → Client auto-reconnects
   - Order not found → Send error event and close

**Why Auto-Simulation?**
- This is a demo project (no real shipping system)
- Auto-simulation lets you see real-time updates
- Each status change updates the database
- Demonstrates SSE functionality

### العربية

**ما هو SSE؟**
- Server-Sent Events = الخادم يدفع التحديثات للعميل في الوقت الفعلي
- اتصال أحادي الاتجاه (خادم → عميل)
- يستخدم HTTP (وليس WebSocket)
- مثالي لتتبع الطلبات المباشر

**التدفق الكامل:**

1. **العميل يفتح الاتصال**
   ```
   المستخدم يدخل معرف الطلب على صفحة /order-status-sse
   ↓
   الواجهة الأمامية تنشئ EventSource('/api/orders/[ID]/stream')
   ↓
   المتصفح يبقي الاتصال مفتوحًا
   ```

2. **الخادم يتعامل مع الاتصال** (`apps/api/src/sse/order-status.js`)
   ```
   استلام الطلب
   ↓
   تعيين رؤوس SSE:
     Content-Type: text/event-stream
     Cache-Control: no-cache
     Connection: keep-alive
   ↓
   استعلام MongoDB للطلب
   ↓
   إرسال الحالة الحالية فورًا
   ↓
   بدء حلقة المحاكاة التلقائية
   ```

3. **حلقة المحاكاة التلقائية** (كل 3-7 ثوان)
   ```
   التحقق من الحالة الحالية
   ↓
   إذا PENDING → التحديث إلى PROCESSING
   إذا PROCESSING → التحديث إلى SHIPPED
   إذا SHIPPED → التحديث إلى DELIVERED
   ↓
   تحديث قاعدة بيانات MongoDB
   ↓
   إرسال حدث SSE للعميل
   ↓
   إذا DELIVERED → إغلاق الاتصال
   وإلا → الانتظار والتكرار
   ```

4. **تنسيق حدث SSE**
   ```
   data: {"status":"PROCESSING","timestamp":"2025-01-15T10:00:00Z"}

   ```
   - يجب أن يحتوي على بادئة "data: "
   - يجب أن ينتهي بسطر جديد مزدوج
   - العميل يستلم ويحلل JSON

5. **العميل يحدث واجهة المستخدم** (`apps/storefront/src/pages/order-status-sse.tsx`)
   ```
   EventSource يستلم الرسالة
   ↓
   تحليل بيانات JSON
   ↓
   تحديث لون شارة الحالة
   ↓
   تحديث تقدم الجدول الزمني
   ↓
   تحديث معلومات الناقل/وقت التسليم المقدر
   ↓
   إذا DELIVERED → إغلاق EventSource
   ```

6. **معالجة الأخطاء**
   - العميل ينقطع → الخادم ينظف الفاصل الزمني
   - خطأ في الشبكة → العميل يعيد الاتصال تلقائيًا
   - الطلب غير موجود → إرسال حدث خطأ وإغلاق

**لماذا المحاكاة التلقائية؟**
- هذا مشروع تجريبي (لا يوجد نظام شحن حقيقي)
- المحاكاة التلقائية تتيح لك رؤية التحديثات في الوقت الفعلي
- كل تغيير في الحالة يحدث قاعدة البيانات
- يوضح وظائف SSE

---

## Part 3: Intelligent Assistant Flow - تدفق المساعد الذكي

### English

**Complete AI Assistant Flow (A to Z):**

1. **User Sends Message**
   ```
   User types: "What is your return policy?"
   ↓
   Frontend (SupportAssistant.tsx) calls api.sendAssistantMessage()
   ↓
   POST /api/assistant/chat with {"message": "What is your return policy?"}
   ```

2. **Intent Classification** (`apps/api/src/assistant/intent-classifier.js`)
   ```
   Receive message
   ↓
   Check keywords for each intent:
   - "return", "refund" → policy_question
   - "order", "track", "status" → order_status
   - "search", "find", "product" → product_search
   - "disappointed", "angry" → complaint
   - "hello", "hi" → chitchat
   - "weather", "joke" → off_topic
   - profanity → violation
   ↓
   Return: {intent: "policy_question", confidence: 0.95}
   ```

3. **Function Execution** (`apps/api/src/assistant/engine.js`)
   
   **Case A: policy_question**
   ```
   No function needed
   ↓
   Go to step 4 (Knowledge Base)
   ```

   **Case B: order_status**
   ```
   Extract order ID or email from message
   ↓
   If email found (e.g., "user@example.com"):
     Call getCustomerOrders(email)
   If order ID found (e.g., "691619293e71dd679f8b9501"):
     Call getOrderStatus(orderId)
   ↓
   Function Registry executes query
   ↓
   Return results to engine
   ```

   **Case C: product_search**
   ```
   Extract search query (e.g., "webcam")
   ↓
   Call searchProducts(query, limit: 5)
   ↓
   MongoDB finds products matching query
   ↓
   Return top 5 products
   ```

4. **Response Generation** (`apps/api/src/assistant/engine.js`)

   **For policy_question:**
   ```
   Query expanded with synonyms
   ↓
   Find relevant policies in ground-truth.json:
     - Match keywords (return, refund → returns category)
     - Get policies matching category
   ↓
   If LLM configured:
     Build prompt with policies + identity
     Call LLM to generate natural response
     LLM must include citation [PolicyID]
   Else:
     Return policy answer directly with [PolicyID]
   ↓
   Validate citations against ground-truth.json
   ↓
   Return response with citations
   ```

   **For order_status (with function results):**
   ```
   Function returned order data
   ↓
   Format response:
     "📦 Order Status Update
      Order ID: 691619293e71dd679f8b9501
      Status: SHIPPED
      Customer: John Doe
      Total: $99.99
      ..."
   ↓
   Return formatted response
   ```

   **For product_search (with function results):**
   ```
   Function returned products list
   ↓
   If LLM configured:
     Build prompt: "Summarize these products..."
     Call LLM for natural language summary
   Else:
     List products with bullet points
   ↓
   Return product summary
   ```

   **For complaint:**
   ```
   Return empathetic response (no LLM needed):
     "I'm really sorry for the trouble...
      Could you share more details?..."
   ```

   **For chitchat:**
   ```
   If LLM configured:
     Call LLM with personality: friendly, professional
     Generate warm greeting
   Else:
     Template response: "Hello! I'm Ahmad..."
   ```

   **For off_topic:**
   ```
   If LLM configured:
     Call LLM to politely redirect
   Else:
     Template: "I appreciate your question, but..."
   ```

   **For violation:**
   ```
   Template response:
     "I understand you may be frustrated, but..."
   ```

5. **Citation Validation** (`apps/api/src/assistant/citation-validator.js`)
   ```
   Extract [PolicyID] from response using regex
   ↓
   Check each PolicyID exists in ground-truth.json
   ↓
   Return validation report:
     {
       isValid: true/false,
       validCitations: ["Policy3.1"],
       invalidCitations: []
     }
   ```

6. **Response Sent to Client**
   ```
   JSON response:
     {
       response: "Items can be returned within 30 days [Policy3.1]",
       intent: "policy_question",
       confidence: 0.95,
       functionsExecuted: [],
       citations: ["Policy3.1"],
       citationValidation: {...}
     }
   ↓
   Frontend displays in chat UI
   ```

**Function Registry System:**
- `register(name, schema, handler)` - Add new function
- `execute(name, params)` - Run function
- Returns: `{success: true/false, result: {...}, function: name}`

**Key Files:**
- `engine.js` - Main orchestrator
- `intent-classifier.js` - 7 intents
- `function-registry.js` - 3 functions
- `citation-validator.js` - Validates PolicyIDs
- `synonyms.js` - Query expansion

### العربية

**تدفق المساعد الذكي الكامل (من الألف إلى الياء):**

1. **المستخدم يرسل رسالة**
   ```
   المستخدم يكتب: "ما هي سياسة الإرجاع الخاصة بكم؟"
   ↓
   الواجهة الأمامية (SupportAssistant.tsx) تستدعي api.sendAssistantMessage()
   ↓
   POST /api/assistant/chat مع {"message": "ما هي سياسة الإرجاع الخاصة بكم؟"}
   ```

2. **تصنيف النية** (`apps/api/src/assistant/intent-classifier.js`)
   ```
   استلام الرسالة
   ↓
   التحقق من الكلمات الرئيسية لكل نية:
   - "إرجاع", "استرداد" → policy_question
   - "طلب", "تتبع", "حالة" → order_status
   - "بحث", "ابحث", "منتج" → product_search
   - "محبط", "غاضب" → complaint
   - "مرحبا", "أهلا" → chitchat
   - "طقس", "نكتة" → off_topic
   - كلمات بذيئة → violation
   ↓
   إرجاع: {intent: "policy_question", confidence: 0.95}
   ```

3. **تنفيذ الوظيفة** (`apps/api/src/assistant/engine.js`)
   
   **الحالة أ: policy_question**
   ```
   لا حاجة لوظيفة
   ↓
   الانتقال إلى الخطوة 4 (قاعدة المعرفة)
   ```

   **الحالة ب: order_status**
   ```
   استخراج معرف الطلب أو البريد الإلكتروني من الرسالة
   ↓
   إذا تم العثور على بريد إلكتروني (مثل "user@example.com"):
     استدعاء getCustomerOrders(email)
   إذا تم العثور على معرف الطلب (مثل "691619293e71dd679f8b9501"):
     استدعاء getOrderStatus(orderId)
   ↓
   سجل الوظائف ينفذ الاستعلام
   ↓
   إرجاع النتائج إلى المحرك
   ```

   **الحالة ج: product_search**
   ```
   استخراج استعلام البحث (مثل "كاميرا ويب")
   ↓
   استدعاء searchProducts(query, limit: 5)
   ↓
   MongoDB يجد المنتجات المطابقة للاستعلام
   ↓
   إرجاع أفضل 5 منتجات
   ```

4. **توليد الاستجابة** (`apps/api/src/assistant/engine.js`)

   **لـ policy_question:**
   ```
   الاستعلام موسع مع المرادفات
   ↓
   البحث عن السياسات ذات الصلة في ground-truth.json:
     - مطابقة الكلمات الرئيسية (إرجاع، استرداد → فئة الإرجاع)
     - الحصول على السياسات المطابقة للفئة
   ↓
   إذا تم تكوين LLM:
     بناء موجه مع السياسات + الهوية
     استدعاء LLM لتوليد استجابة طبيعية
     يجب على LLM تضمين الاستشهاد [PolicyID]
   وإلا:
     إرجاع إجابة السياسة مباشرة مع [PolicyID]
   ↓
   التحقق من صحة الاستشهادات مقابل ground-truth.json
   ↓
   إرجاع الاستجابة مع الاستشهادات
   ```

   **لـ order_status (مع نتائج الوظيفة):**
   ```
   الوظيفة أرجعت بيانات الطلب
   ↓
   تنسيق الاستجابة:
     "📦 تحديث حالة الطلب
      معرف الطلب: 691619293e71dd679f8b9501
      الحالة: تم الشحن
      العميل: جون دو
      الإجمالي: 99.99 دولار
      ..."
   ↓
   إرجاع الاستجابة المنسقة
   ```

   **لـ product_search (مع نتائج الوظيفة):**
   ```
   الوظيفة أرجعت قائمة المنتجات
   ↓
   إذا تم تكوين LLM:
     بناء موجه: "لخص هذه المنتجات..."
     استدعاء LLM لملخص اللغة الطبيعية
   وإلا:
     قائمة المنتجات بنقاط
   ↓
   إرجاع ملخص المنتج
   ```

   **لـ complaint:**
   ```
   إرجاع استجابة متعاطفة (لا حاجة لـ LLM):
     "أنا آسف حقًا للمشكلة...
      هل يمكنك مشاركة المزيد من التفاصيل؟..."
   ```

   **لـ chitchat:**
   ```
   إذا تم تكوين LLM:
     استدعاء LLM مع الشخصية: ودود، محترف
     توليد تحية دافئة
   وإلا:
     استجابة القالب: "مرحباً! أنا أحمد..."
   ```

   **لـ off_topic:**
   ```
   إذا تم تكوين LLM:
     استدعاء LLM لإعادة التوجيه بأدب
   وإلا:
     القالب: "أقدر سؤالك، لكن..."
   ```

   **لـ violation:**
   ```
   استجابة القالب:
     "أفهم أنك قد تكون محبطًا، لكن..."
   ```

5. **التحقق من صحة الاستشهاد** (`apps/api/src/assistant/citation-validator.js`)
   ```
   استخراج [PolicyID] من الاستجابة باستخدام regex
   ↓
   التحقق من وجود كل PolicyID في ground-truth.json
   ↓
   إرجاع تقرير التحقق:
     {
       isValid: true/false,
       validCitations: ["Policy3.1"],
       invalidCitations: []
     }
   ```

6. **إرسال الاستجابة للعميل**
   ```
   استجابة JSON:
     {
       response: "يمكن إرجاع العناصر في غضون 30 يومًا [Policy3.1]",
       intent: "policy_question",
       confidence: 0.95,
       functionsExecuted: [],
       citations: ["Policy3.1"],
       citationValidation: {...}
     }
   ↓
   الواجهة الأمامية تعرض في واجهة المستخدم للدردشة
   ```

**نظام سجل الوظائف:**
- `register(name, schema, handler)` - إضافة وظيفة جديدة
- `execute(name, params)` - تشغيل الوظيفة
- إرجاع: `{success: true/false, result: {...}, function: name}`

**الملفات الرئيسية:**
- `engine.js` - المنسق الرئيسي
- `intent-classifier.js` - 7 نوايا
- `function-registry.js` - 3 وظائف
- `citation-validator.js` - يتحقق من PolicyIDs
- `synonyms.js` - توسيع الاستعلام

---

## Part 4: Admin Dashboard Flow - تدفق لوحة التحكم الإدارية

### English

**Complete Dashboard Flow:**

1. **User Visits /admin**
   ```
   Browser loads AdminDashboard.tsx
   ↓
   Component mounts → useEffect runs
   ↓
   Calls loadDashboardData()
   ```

2. **Data Fetching** (`apps/storefront/src/pages/admin-dashboard.tsx`)
   ```
   Fetch /api/dashboard/business-metrics
   ↓
   Backend queries MongoDB:
     - Total revenue: SUM(orders.total)
     - Total orders: COUNT(orders)
     - Total customers: COUNT(customers)
     - Avg order value: revenue / orders
     - Recent orders: Last 5 orders
     - Top products: GROUP BY productId, SUM(quantity)
   ↓
   Return aggregated data
   
   Fetch /api/dashboard/performance
   ↓
   Backend returns:
     - API latency (tracked in middleware)
     - SSE connections (counter in memory)
     - Request rate
   
   Fetch /api/dashboard/assistant-stats
   ↓
   Backend returns:
     - Total queries (tracked on each /chat call)
     - Intent distribution (count per intent)
     - Function calls (count per function)
     - Avg response time
   ```

3. **Data Display**
   ```
   All data loaded
   ↓
   React state updated
   ↓
   Components re-render:
     - MetricCard for each KPI
     - Table for recent orders (FULL 24-char IDs)
     - List for top products
     - Performance metrics grid
     - Assistant analytics
   ```

4. **Auto-Refresh** (Optional)
   ```
   Set interval to reload data every 30 seconds
   ↓
   Dashboard always shows current data
   ```

**Key Metrics Calculated:**

**Business:**
- Total Revenue = `db.collection('orders').aggregate([{$group: {_id: null, total: {$sum: "$total"}}}])`
- Average Order Value = Total Revenue / Order Count

**Performance:**
- API Latency = Track time in Express middleware, calculate average
- SSE Connections = Counter incremented on connect, decremented on disconnect

**Assistant:**
- Intent Distribution = Count each intent classification
- Function Calls = Count each function execution
- Response Time = Track time from request to response

### العربية

**تدفق لوحة التحكم الكامل:**

1. **المستخدم يزور /admin**
   ```
   المتصفح يحمل AdminDashboard.tsx
   ↓
   المكون يُثبت → useEffect يعمل
   ↓
   يستدعي loadDashboardData()
   ```

2. **جلب البيانات** (`apps/storefront/src/pages/admin-dashboard.tsx`)
   ```
   جلب /api/dashboard/business-metrics
   ↓
   الواجهة الخلفية تستعلم MongoDB:
     - إجمالي الإيرادات: SUM(orders.total)
     - إجمالي الطلبات: COUNT(orders)
     - إجمالي العملاء: COUNT(customers)
     - متوسط ​​قيمة الطلب: الإيرادات / الطلبات
     - الطلبات الأخيرة: آخر 5 طلبات
     - أفضل المنتجات: GROUP BY productId, SUM(quantity)
   ↓
   إرجاع البيانات المجمعة
   
   جلب /api/dashboard/performance
   ↓
   الواجهة الخلفية ترجع:
     - زمن انتقال API (يتم تتبعه في middleware)
     - اتصالات SSE (عداد في الذاكرة)
     - معدل الطلب
   
   جلب /api/dashboard/assistant-stats
   ↓
   الواجهة الخلفية ترجع:
     - إجمالي الاستعلامات (يتم تتبعها في كل استدعاء /chat)
     - توزيع النية (العد لكل نية)
     - استدعاءات الوظيفة (العد لكل وظيفة)
     - متوسط ​​وقت الاستجابة
   ```

3. **عرض البيانات**
   ```
   تم تحميل جميع البيانات
   ↓
   تحديث حالة React
   ↓
   إعادة عرض المكونات:
     - MetricCard لكل مؤشر أداء رئيسي
     - جدول للطلبات الأخيرة (معرفات كاملة من 24 حرفًا)
     - قائمة لأفضل المنتجات
     - شبكة مقاييس الأداء
     - تحليلات المساعد
   ```

4. **التحديث التلقائي** (اختياري)
   ```
   تعيين فاصل زمني لإعادة تحميل البيانات كل 30 ثانية
   ↓
   لوحة التحكم تعرض دائمًا البيانات الحالية
   ```

**المقاييس الرئيسية المحسوبة:**

**الأعمال:**
- إجمالي الإيرادات = `db.collection('orders').aggregate([{$group: {_id: null, total: {$sum: "$total"}}}])`
- متوسط ​​قيمة الطلب = إجمالي الإيرادات / عدد الطلبات

**الأداء:**
- زمن انتقال API = تتبع الوقت في Express middleware، حساب المتوسط
- اتصالات SSE = عداد يزداد عند الاتصال، وينقص عند قطع الاتصال

**المساعد:**
- توزيع النية = عد كل تصنيف نية
- استدعاءات الوظيفة = عد كل تنفيذ وظيفة
- وقت الاستجابة = تتبع الوقت من الطلب إلى الاستجابة

---

## Part 5: Complete User Journey - رحلة المستخدم الكاملة

### English

**Scenario: Customer Wants to Buy a Webcam**

1. **Browse Products**
   ```
   Visit storefront → /
   ↓
   Frontend loads products from /api/products
   ↓
   MongoDB returns 20-30 products
   ↓
   Display product grid
   ```

2. **Ask Assistant for Help**
   ```
   Open chat (bottom right)
   ↓
   Type: "search for webcam"
   ↓
   Intent: product_search
   ↓
   Function: searchProducts("webcam", 5)
   ↓
   MongoDB: db.products.find({name: /webcam/i})
   ↓
   Returns: 3 webcam products
   ↓
   Assistant: "I found these webcams: ..."
   ```

3. **Ask About Policy**
   ```
   Type: "What is your return policy?"
   ↓
   Intent: policy_question
   ↓
   Find policies matching "return"
   ↓
   Load from ground-truth.json
   ↓
   Assistant: "Items can be returned within 30 days [Policy3.1]"
   ```

4. **Create Order** (Simulated)
   ```
   Click product → Add to cart
   ↓
   Checkout
   ↓
   POST /api/orders with items, customer info
   ↓
   MongoDB inserts order with status: PENDING
   ↓
   Returns order ID: 691619293e71dd679f8b9501
   ```

5. **Track Order in Real-Time**
   ```
   Go to /order-status-sse
   ↓
   Enter order ID
   ↓
   EventSource connects to /api/orders/[ID]/stream
   ↓
   Immediately receive: PENDING
   ↓
   3 seconds later: PROCESSING
   ↓
   7 seconds later: SHIPPED
   ↓
   7 seconds later: DELIVERED
   ↓
   Connection closes
   ```

6. **Ask Assistant About Order**
   ```
   Open chat
   ↓
   Type: "What's the status of order 691619293e71dd679f8b9501?"
   ↓
   Intent: order_status
   ↓
   Function: getOrderStatus("691619293e71dd679f8b9501")
   ↓
   MongoDB: db.orders.findOne({_id: ObjectId(...)})
   ↓
   Returns: {status: "DELIVERED", total: 99.99, ...}
   ↓
   Assistant: "📦 Order Status Update: DELIVERED..."
   ```

7. **Check All My Orders by Email**
   ```
   Type: "show my orders for john@example.com"
   ↓
   Intent: order_status
   ↓
   Email detected: john@example.com
   ↓
   Function: getCustomerOrders("john@example.com")
   ↓
   MongoDB: 
     - Find customer by email
     - Find all orders for that customer
   ↓
   Returns: 3 orders
   ↓
   Assistant: "📦 Orders for John Doe (john@example.com)..."
   ```

8. **Admin Views Dashboard**
   ```
   Admin visits /admin
   ↓
   Dashboard loads metrics:
     - Revenue: $2,450.00 (from 18 orders)
     - Recent order: 691619293e71dd679f8b9501 (DELIVERED)
     - Top product: Webcam HD (5 sold)
     - Assistant: 42 queries, 15 function calls
   ```

### العربية

**السيناريو: العميل يريد شراء كاميرا ويب**

1. **تصفح المنتجات**
   ```
   زيارة الواجهة → /
   ↓
   الواجهة الأمامية تحمل المنتجات من /api/products
   ↓
   MongoDB يرجع 20-30 منتج
   ↓
   عرض شبكة المنتجات
   ```

2. **اسأل المساعد للمساعدة**
   ```
   فتح الدردشة (أسفل اليمين)
   ↓
   اكتب: "ابحث عن كاميرا ويب"
   ↓
   النية: product_search
   ↓
   الوظيفة: searchProducts("كاميرا ويب", 5)
   ↓
   MongoDB: db.products.find({name: /webcam/i})
   ↓
   إرجاع: 3 منتجات كاميرا ويب
   ↓
   المساعد: "وجدت هذه الكاميرات..."
   ```

3. **اسأل عن السياسة**
   ```
   اكتب: "ما هي سياسة الإرجاع الخاصة بكم؟"
   ↓
   النية: policy_question
   ↓
   البحث عن السياسات المطابقة لـ "الإرجاع"
   ↓
   التحميل من ground-truth.json
   ↓
   المساعد: "يمكن إرجاع العناصر في غضون 30 يومًا [Policy3.1]"
   ```

4. **إنشاء طلب** (محاكاة)
   ```
   انقر على المنتج → أضف إلى السلة
   ↓
   الدفع
   ↓
   POST /api/orders مع العناصر، معلومات العميل
   ↓
   MongoDB يدرج الطلب مع الحالة: PENDING
   ↓
   إرجاع معرف الطلب: 691619293e71dd679f8b9501
   ```

5. **تتبع الطلب في الوقت الفعلي**
   ```
   الانتقال إلى /order-status-sse
   ↓
   إدخال معرف الطلب
   ↓
   EventSource يتصل بـ /api/orders/[ID]/stream
   ↓
   استلام فوري: PENDING
   ↓
   بعد 3 ثوان: PROCESSING
   ↓
   بعد 7 ثوان: SHIPPED
   ↓
   بعد 7 ثوان: DELIVERED
   ↓
   إغلاق الاتصال
   ```

6. **اسأل المساعد عن الطلب**
   ```
   فتح الدردشة
   ↓
   اكتب: "ما هي حالة الطلب 691619293e71dd679f8b9501؟"
   ↓
   النية: order_status
   ↓
   الوظيفة: getOrderStatus("691619293e71dd679f8b9501")
   ↓
   MongoDB: db.orders.findOne({_id: ObjectId(...)})
   ↓
   إرجاع: {status: "DELIVERED", total: 99.99, ...}
   ↓
   المساعد: "📦 تحديث حالة الطلب: تم التسليم..."
   ```

7. **التحقق من جميع طلباتي بالبريد الإلكتروني**
   ```
   اكتب: "اعرض طلباتي لـ john@example.com"
   ↓
   النية: order_status
   ↓
   اكتشاف البريد الإلكتروني: john@example.com
   ↓
   الوظيفة: getCustomerOrders("john@example.com")
   ↓
   MongoDB: 
     - البحث عن العميل بالبريد الإلكتروني
     - البحث عن جميع الطلبات لهذا العميل
   ↓
   إرجاع: 3 طلبات
   ↓
   المساعد: "📦 طلبات جون دو (john@example.com)..."
   ```

8. **المشرف يعرض لوحة التحكم**
   ```
   المشرف يزور /admin
   ↓
   لوحة التحكم تحمل المقاييس:
     - الإيرادات: 2450.00 دولار (من 18 طلب)
     - الطلب الأخير: 691619293e71dd679f8b9501 (تم التسليم)
     - المنتج الأفضل: كاميرا ويب HD (تم بيع 5)
     - المساعد: 42 استعلام، 15 استدعاء وظيفة
   ```

---

## Summary - الملخص

### English

**The complete system works like this:**

1. **Frontend (Vercel)** - React app with UI
2. **Backend (Render)** - Express API with routes
3. **Database (MongoDB Atlas)** - Cloud database
4. **AI Assistant** - Intent classification → Function execution → Response
5. **SSE** - Real-time order tracking with auto-simulation
6. **Admin Dashboard** - Business metrics and analytics

**All parts connected:**
- Frontend calls Backend API
- Backend queries MongoDB
- Assistant uses Intent Classifier + Function Registry + Knowledge Base
- SSE pushes updates to Frontend
- Dashboard shows real-time metrics

### العربية

**النظام الكامل يعمل على هذا النحو:**

1. **الواجهة الأمامية (Vercel)** - تطبيق React مع واجهة المستخدم
2. **الواجهة الخلفية (Render)** - Express API مع المسارات
3. **قاعدة البيانات (MongoDB Atlas)** - قاعدة بيانات سحابية
4. **المساعد الذكي** - تصنيف النية → تنفيذ الوظيفة → الاستجابة
5. **SSE** - تتبع الطلبات في الوقت الفعلي مع المحاكاة التلقائية
6. **لوحة التحكم الإدارية** - مقاييس الأعمال والتحليلات

**جميع الأجزاء متصلة:**
- الواجهة الأمامية تستدعي Backend API
- الواجهة الخلفية تستعلم MongoDB
- المساعد يستخدم مصنف النية + سجل الوظائف + قاعدة المعرفة
- SSE يدفع التحديثات إلى الواجهة الأمامية
- لوحة التحكم تعرض المقاييس في الوقت الفعلي
