// Programmatic validation script to check signup, login, CORS capabilities, and token usage using native global fetch.
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

      // 3. Test Admin Protected Dashboard APIs
      console.log("\n[Test 3] Calling Admin Protected User Management Endpoint...");
      const adminUsersRes = await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (adminUsersRes.ok) {
        const users = await adminUsersRes.json();
        console.log(`✅ Admin Authorized Endpoint PASSED! Recieved ${users.length} users:`);
        users.forEach(u => console.log(` - ID: ${u.id}, Name: "${u.name}", Email: "${u.email}", Role: "${u.role}"`));
      } else {
        console.error(`❌ Admin Endpoint FAILED with status: ${adminUsersRes.status}`);
      }

      // 4. Test CORS preflight capability
      console.log("\n[Test 4] Simulating CORS Preflight Request from port 5177...");
      const corsRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost:5177",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type"
        }
      });

      console.log(`✅ CORS Preflight Response Status: ${corsRes.status}`);
      console.log(`Access-Control-Allow-Origin: ${corsRes.headers.get("access-control-allow-origin")}`);
      console.log(`Access-Control-Allow-Credentials: ${corsRes.headers.get("access-control-allow-credentials")}`);

    } else {
      console.error(`❌ Admin Login failed with status: ${loginRes.status}`);
    }

  } catch (error) {
    console.error("❌ Diagnostic suite hit an unexpected error:", error.message);
  }
}

runTests();
