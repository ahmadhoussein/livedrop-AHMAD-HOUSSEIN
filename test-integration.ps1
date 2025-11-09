# Ahmad Store Integration Test Script
# Run this after setting up your Colab LLM and starting the backend

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Ahmad Store Integration Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LLM_URL = "https://squirmiest-sharell-superceremoniously.ngrok-free.dev"
$API_URL = "http://localhost:3001"

Write-Host "Testing components..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Colab LLM /generate endpoint
Write-Host "1. Testing Colab LLM /generate endpoint..." -ForegroundColor Green
try {
    $body = '{"prompt": "Say hello"}'
    $response = curl.exe -k -s -X POST -H "Content-Type: application/json" -d $body "$LLM_URL/generate"
    $result = $response | ConvertFrom-Json
    if ($result.text) {
        Write-Host "   ✓ LLM is responding" -ForegroundColor Green
        Write-Host "   Response: $($result.text.Substring(0, [Math]::Min(50, $result.text.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ✗ LLM response format unexpected" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to connect to LLM" -ForegroundColor Red
    Write-Host "   Make sure Colab is running and ngrok URL is correct" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Backend API health
Write-Host "2. Testing Backend API..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Backend API is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend API is not running" -ForegroundColor Red
    Write-Host "   Run: cd apps/api && npm run dev" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: MongoDB connection
Write-Host "3. Testing MongoDB connection..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/products?limit=1" -Method Get -ErrorAction Stop
    Write-Host "   ✓ MongoDB is connected" -ForegroundColor Green
    Write-Host "   Products in DB: $($response.total)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ MongoDB connection failed" -ForegroundColor Red
    Write-Host "   Check MONGODB_URI in apps/api/.env" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Assistant endpoint
Write-Host "4. Testing Assistant endpoint..." -ForegroundColor Green
try {
    $body = @{
        query = "What is your return policy?"
        customerId = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/assistant/chat" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "   ✓ Assistant is responding" -ForegroundColor Green
    Write-Host "   Intent detected: $($response.intent)" -ForegroundColor Gray
    Write-Host "   Response: $($response.text.Substring(0, [Math]::Min(100, $response.text.Length)))..." -ForegroundColor Gray
    
    if ($response.citations) {
        Write-Host "   Citations: $($response.citations -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Assistant endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Function calling (order status)
Write-Host "5. Testing Function Calling (Order Status)..." -ForegroundColor Green
try {
    $body = @{
        query = "Track my order"
        customerId = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/assistant/chat" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    if ($response.functionsCalled) {
        Write-Host "   ✓ Functions are being called" -ForegroundColor Green
        Write-Host "   Functions used: $($response.functionsCalled -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "   ℹ No functions called (expected if no order ID provided)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Function calling test failed" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Integration Test Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open frontend: cd apps/storefront && npm run dev" -ForegroundColor White
Write-Host "2. Test chat UI at http://localhost:3000" -ForegroundColor White
Write-Host "3. Try these test queries:" -ForegroundColor White
Write-Host "   - 'What is your return policy?'" -ForegroundColor Gray
Write-Host "   - 'Do you have wireless headphones?'" -ForegroundColor Gray
Write-Host "   - 'Track order #12345'" -ForegroundColor Gray
Write-Host ""
