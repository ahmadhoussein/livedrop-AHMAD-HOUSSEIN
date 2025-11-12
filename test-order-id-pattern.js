/**
 * Test Order ID Pattern Matching
 * Run: node test-order-id-pattern.js
 */

// New improved pattern
const orderIdPattern = /\b([a-f0-9]{8,}|\d{8,})\b/i;

// Test cases
const testCases = [
  // Short hex IDs (8 characters) - YOUR CASE
  { input: "check order d2a65165", expected: "d2a65165", shouldMatch: true },
  { input: "order status for d2a65165", expected: "d2a65165", shouldMatch: true },
  { input: "what's the status of order d2a65165", expected: "d2a65165", shouldMatch: true },
  
  // Longer hex IDs (12 characters)
  { input: "track order abc123def456", expected: "abc123def456", shouldMatch: true },
  
  // MongoDB ObjectIds (24 hex characters)
  { input: "check 507f1f77bcf86cd799439011", expected: "507f1f77bcf86cd799439011", shouldMatch: true },
  { input: "order 507f191e810c19729de860ea status", expected: "507f191e810c19729de860ea", shouldMatch: true },
  
  // Numeric order IDs (8+ digits)
  { input: "track order 12345678", expected: "12345678", shouldMatch: true },
  { input: "order 123456789012", expected: "123456789012", shouldMatch: true },
  
  // Should NOT match (too short)
  { input: "order abc123", expected: null, shouldMatch: false },
  { input: "check 1234567", expected: null, shouldMatch: false },
  
  // Should NOT match (no order ID)
  { input: "what is your return policy", expected: null, shouldMatch: false },
  { input: "hello", expected: null, shouldMatch: false }
];

console.log("🧪 Testing Order ID Pattern Matching\n");
console.log("Pattern:", orderIdPattern.toString());
console.log("=" .repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const match = test.input.match(orderIdPattern);
  const extractedId = match ? match[1] : null;
  const success = test.shouldMatch 
    ? (extractedId === test.expected)
    : (extractedId === null);
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAIL`);
  }
  
  console.log(`   Input: "${test.input}"`);
  console.log(`   Expected: ${test.expected || "null"}`);
  console.log(`   Got: ${extractedId || "null"}`);
  console.log("");
});

console.log("=" .repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log("🎉 All tests passed! The pattern is working correctly.");
} else {
  console.log("⚠️ Some tests failed. Check the pattern logic.");
}
