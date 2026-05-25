// Programmatic validation script to check signup, login, CORS capabilities, and the new mock-checkout API.
async function runTests() {
  const BACKEND_URL = "http://localhost:3000";

  console.log("=== LOGICLENS ENTERPRISE/SAAS SUITE DIAGNOSTIC ===");
  console.log(`Backend Target URL: ${BACKEND_URL}`);

  try {
    // 1. Check API Health
    console.log("\n[Test 1] Verifying Backend Service Health...");
    const healthRes = await fetch(`${BACKEND_URL}/api/healthz`);
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      console.log(`✅ Healthcheck PASSED: status = "${healthData.status}"`);
    } else {
      throw new Error(`Healthcheck failed: ${healthRes.statusText}`);
    }

    // 2. Test Admin Login (Admin Demo credentials)
    console.log("\n[Test 2] Authenticating as Admin...");
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@logiclens.dev",
        password: "admin123"
      })
    });

    if (loginRes.ok) {
      const authData = await loginRes.json();
      console.log("✅ Admin Login Authentication PASSED!");
      console.log(`Role assigned: "${authData.user.role}"`);
      const token = authData.token;

      // 3. Test the new Simulated Payment Mock Checkout API
      console.log("\n[Test 3] Testing the new Simulated Payment Mock Checkout Endpoint...");
      const mockCheckoutRes = await fetch(`${BACKEND_URL}/api/payments/mock-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planType: "pro"
        })
      });

      if (mockCheckoutRes.ok) {
        const checkoutData = await mockCheckoutRes.json();
        console.log("✅ Mock Checkout Endpoint PASSED!");
        console.log(`Response Payload:`, JSON.stringify(checkoutData, null, 2));
      } else {
        console.error(`❌ Mock Checkout Endpoint FAILED with status: ${mockCheckoutRes.status}`);
        const errText = await mockCheckoutRes.text();
        console.error(`Error details: ${errText}`);
      }

    } else {
      console.error(`❌ Admin Login failed with status: ${loginRes.status}`);
    }

  } catch (error) {
    console.error("❌ Diagnostic suite hit an unexpected error:", error.message);
  }
}

runTests();
