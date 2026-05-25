import { Router } from "express";
import { env } from "../lib/env.js";
import { authMiddleware } from "../middlewares/auth.js";
import type { Request, Response } from "express";
import type { AuthPayload } from "../middlewares/auth.js";
import { getUserById, updateUser, createPaymentRecord, getPaymentRecordByRequestId, updatePaymentRecord } from "../lib/store.js";
import crypto from "crypto";

const router = Router();

// Pricing constants in INR
const PRICING = {
  pro: "299",
  institutional: "9999",
};

// 1. Create a Payment Intent (Unified entry point for Zomato UPI & Card/Netbanking flows)
router.post("/create-payment-intent", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const { planType, paymentMethod } = req.body;
  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const isInstitutional = planType?.toLowerCase() === "institutional";
  const plan = isInstitutional ? "institutional" : "pro";
  const amount = PRICING[plan];

  const hasInstamojoKeys =
    env.INSTAMOJO_API_KEY &&
    env.INSTAMOJO_API_KEY !== "placeholder" &&
    env.INSTAMOJO_API_KEY.trim() !== "" &&
    env.INSTAMOJO_AUTH_TOKEN &&
    env.INSTAMOJO_AUTH_TOKEN !== "placeholder" &&
    env.INSTAMOJO_AUTH_TOKEN.trim() !== "";

  const paymentRequestId = hasInstamojoKeys
    ? "IM_" + crypto.randomBytes(8).toString("hex") // temporary, will overwrite with Instamojo API response
    : "SIM_REQ_" + crypto.randomBytes(12).toString("hex");

  // Construct standard UPI deep link
  const vpa = env.UPI_VPA || "mohdazhar2417@okaxis";
  const upiUrl = `upi://pay?pa=${vpa}&pn=LogicLens&am=${amount}&cu=INR&tn=LogicLens_${plan}_${userId}`;

  if (!hasInstamojoKeys) {
    // Simulated Offline Flow
    const record = await createPaymentRecord({
      userId,
      planType: plan,
      amount,
      paymentMethod,
      paymentRequestId,
      status: "pending",
    });

    const mockCheckoutUrl = `${env.BACKEND_URL}/api/payments/mock-gateway?id=${paymentRequestId}`;

    res.json({
      paymentRequestId,
      upiUrl,
      redirectUrl: mockCheckoutUrl,
      isMock: true,
    });
    return;
  }

  // Real Instamojo API request flow
  try {
    const isSandbox = env.INSTAMOJO_SANDBOX === "true" || env.INSTAMOJO_SANDBOX === "1";
    const instamojoBaseUrl = isSandbox
      ? "https://test.instamojo.com/api/1.1"
      : "https://www.instamojo.com/api/1.1";

    const params = new URLSearchParams();
    params.append("amount", amount);
    params.append("purpose", `LogicLens Premium (${plan.toUpperCase()})`);
    params.append("buyer_name", user.name);
    params.append("email", user.email);
    params.append("redirect_url", `${env.BACKEND_URL}/api/payments/instamojo-callback`);
    params.append("webhook", `${env.BACKEND_URL}/api/payments/instamojo-webhook`);
    params.append("allow_repeated_payments", "false");

    const response = await fetch(`${instamojoBaseUrl}/payment-requests/`, {
      method: "POST",
      headers: {
        "X-Api-Key": env.INSTAMOJO_API_KEY!,
        "X-Auth-Token": env.INSTAMOJO_AUTH_TOKEN!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Instamojo creation failed: ${errorText}`);
    }

    const data = await response.json() as any;
    const realRequestId = data.payment_request.id;
    const redirectUrl = data.payment_request.longurl;

    // Create payment intent record with real Instamojo request ID
    await createPaymentRecord({
      userId,
      planType: plan,
      amount,
      paymentMethod,
      paymentRequestId: realRequestId,
      status: "pending",
    });

    res.json({
      paymentRequestId: realRequestId,
      upiUrl,
      redirectUrl,
      isMock: false,
    });
  } catch (err: any) {
    console.error("Instamojo initiation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Poll Status Endpoint (Checks the DB status, performs server-to-server check if pending)
router.get("/status/:requestId", async (req: Request, res: Response): Promise<void> => {
  const { requestId } = req.params;
  const record = await getPaymentRecordByRequestId(requestId);

  if (!record) {
    res.status(404).json({ error: "Payment request not found" });
    return;
  }

  // If status is pending and keys are configured, check with Instamojo API
  const hasInstamojoKeys =
    env.INSTAMOJO_API_KEY &&
    env.INSTAMOJO_AUTH_TOKEN &&
    !requestId.startsWith("SIM_REQ_");

  if (record.status === "pending" && hasInstamojoKeys) {
    try {
      const isSandbox = env.INSTAMOJO_SANDBOX === "true" || env.INSTAMOJO_SANDBOX === "1";
      const instamojoBaseUrl = isSandbox
        ? "https://test.instamojo.com/api/1.1"
        : "https://www.instamojo.com/api/1.1";

      const response = await fetch(`${instamojoBaseUrl}/payment-requests/${requestId}/`, {
        headers: {
          "X-Api-Key": env.INSTAMOJO_API_KEY!,
          "X-Auth-Token": env.INSTAMOJO_AUTH_TOKEN!,
        },
      });

      if (response.ok) {
        const data = await response.json() as any;
        const imStatus = data.payment_request.status; // e.g. "Completed"
        
        // In Instamojo: "Completed" means paid
        if (imStatus === "Completed" || data.payment_request.payments?.some((p: any) => p.status === "Credit")) {
          await updatePaymentRecord(record.id, { status: "completed" });
          await updateUser(record.userId, {
            subscriptionStatus: "active",
            planType: record.planType,
          });
          record.status = "completed";
        } else if (imStatus === "Failed") {
          await updatePaymentRecord(record.id, { status: "failed" });
          record.status = "failed";
        }
      }
    } catch (err) {
      console.error("Error doing server-to-server Instamojo verify:", err);
    }
  }

  res.json({ status: record.status });
});

// 3. Dev Simulation Trigger (Convenient offline sandbox trigger)
router.post("/simulate-payment-success", async (req: Request, res: Response): Promise<void> => {
  const { requestId } = req.body;
  const record = await getPaymentRecordByRequestId(requestId);

  if (!record) {
    res.status(404).json({ error: "Payment request not found" });
    return;
  }

  // Set to success
  await updatePaymentRecord(record.id, { status: "completed" });
  await updateUser(record.userId, {
    subscriptionStatus: "active",
    planType: record.planType,
  });

  console.log(`[SIMULATION] Payment ${requestId} marked completed. User ${record.userId} upgraded to ${record.planType}.`);
  res.json({ success: true });
});

// 4. Callback Handler Redirect URL (Instamojo redirects buyer back here)
router.get("/instamojo-callback", async (req: Request, res: Response): Promise<void> => {
  const { payment_request_id, payment_status } = req.query;

  if (!payment_request_id) {
    res.redirect(`${env.FRONTEND_URL}/dashboard?payment=failed`);
    return;
  }

  const record = await getPaymentRecordByRequestId(payment_request_id as string);
  if (!record) {
    res.redirect(`${env.FRONTEND_URL}/dashboard?payment=failed`);
    return;
  }

  // Credit means success
  if (payment_status === "Credit" || payment_status === "completed") {
    await updatePaymentRecord(record.id, { status: "completed" });
    await updateUser(record.userId, {
      subscriptionStatus: "active",
      planType: record.planType,
    });
    res.redirect(`${env.FRONTEND_URL}/dashboard?payment=success`);
  } else {
    res.redirect(`${env.FRONTEND_URL}/dashboard?payment=failed`);
  }
});

// 5. Instamojo Webhook Asynchronous Endpoint
router.post("/instamojo-webhook", async (req: Request, res: Response): Promise<void> => {
  const { payment_request_id, status, mac } = req.body;

  if (!payment_request_id || !status) {
    res.status(400).send("Bad Request");
    return;
  }

  // Signature verification (if salt is defined)
  if (env.INSTAMOJO_SALT) {
    const keys = Object.keys(req.body).filter(k => k !== "mac").sort();
    const message = keys.map(k => req.body[k]).join("|");
    const hmac = crypto.createHmac("sha1", env.INSTAMOJO_SALT);
    hmac.update(message);
    const calculatedMac = hmac.digest("hex");
    if (calculatedMac !== mac) {
      console.warn("Instamojo webhook MAC mismatch!");
      res.status(400).send("Signature verification failed");
      return;
    }
  }

  const record = await getPaymentRecordByRequestId(payment_request_id);
  if (!record) {
    res.status(404).send("Transaction not found");
    return;
  }

  if (status === "Credit") {
    await updatePaymentRecord(record.id, { status: "completed" });
    await updateUser(record.userId, {
      subscriptionStatus: "active",
      planType: record.planType,
    });
    console.log(`Webhook succeeded: Upgraded user ${record.userId} to ${record.planType}`);
  }

  res.send("OK");
});

// 6. Interactive Mock Instamojo Gateway HTML Screen
router.get("/mock-gateway", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.query;
  const record = await getPaymentRecordByRequestId(id as string);

  if (!record) {
    res.status(404).send("Invalid payment reference ID.");
    return;
  }

  const user = await getUserById(record.userId);

  // Return a beautiful payment interface mockup matching Instamojo branding
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Instamojo - Secure Payment Checkout</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body { background-color: #f7f9fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      </style>
    </head>
    <body class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- Instamojo Header -->
        <div class="bg-[#1D2C4D] text-white p-5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-emerald-400 text-xl animate-pulse"></i>
            <div>
              <h1 class="text-md font-bold leading-tight">instamojo</h1>
              <p class="text-[10px] text-gray-300">100% Secure Payments</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[9px] text-gray-400 uppercase tracking-wider">Purpose</p>
            <p class="text-xs font-bold text-gray-200">LogicLens ${record.planType.toUpperCase()}</p>
          </div>
        </div>

        <!-- Payment Info Banner -->
        <div class="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center">
          <div>
            <p class="text-xs text-gray-500 font-semibold">${user?.name || 'Customer'}</p>
            <p class="text-[10px] text-gray-400">${user?.email || 'email@example.com'}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400">Amount to Pay</p>
            <p class="text-2xl font-black text-gray-800">₹${record.amount}.00</p>
          </div>
        </div>

        <!-- Payment Details Form -->
        <div class="p-6 space-y-6">
          <div class="space-y-4">
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Simulate Payment Options</h2>

            <!-- Cards -->
            <div class="p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-400 cursor-pointer transition-all bg-white shadow-sm">
              <div class="flex items-center gap-3">
                <i class="fa-regular fa-credit-card text-blue-500 text-lg"></i>
                <span class="text-xs font-bold text-gray-700">Credit / Debit Card</span>
              </div>
              <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">VISA / MC</span>
            </div>

            <!-- UPI QR -->
            <div class="p-3 border border-emerald-200 rounded-lg flex items-center justify-between hover:border-emerald-400 cursor-pointer transition-all bg-emerald-50/20 shadow-sm">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-qrcode text-emerald-500 text-lg"></i>
                <div>
                  <p class="text-xs font-bold text-gray-700">UPI / QR Code</p>
                  <p class="text-[9px] text-gray-400">Scan & Pay securely</p>
                </div>
              </div>
              <span class="text-[9px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-100/50 px-2 py-0.5 rounded">GPay, PhonePe, Paytm</span>
            </div>

            <!-- Netbanking -->
            <div class="p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-400 cursor-pointer transition-all bg-white shadow-sm">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-building-columns text-gray-600 text-lg"></i>
                <span class="text-xs font-bold text-gray-700">Netbanking</span>
              </div>
              <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
            </div>
          </div>

          <!-- Checkout Action Buttons -->
          <div class="space-y-2 pt-4">
            <button
              onclick="triggerPayment('Credit')"
              class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-circle-check"></i>
              Simulate Success Payment
            </button>
            <button
              onclick="triggerPayment('Failed')"
              class="w-full border border-red-200 hover:bg-red-50 text-red-500 font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all"
            >
              Simulate Failure
            </button>
          </div>
        </div>

        <div class="bg-gray-50 p-4 text-center border-t border-gray-100 flex items-center justify-center gap-1.5 text-gray-400 text-[10px]">
          <i class="fa-solid fa-lock text-emerald-500"></i>
          <span>PCI-DSS Compliant 256-bit SSL secure checkout encryption.</span>
        </div>
      </div>

      <script>
        function triggerPayment(status) {
          const redirectUrl = '/api/payments/instamojo-callback?payment_request_id=${record.paymentRequestId}&payment_status=' + status + '&payment_id=MOJO_MOCK_' + Date.now();
          window.location.href = redirectUrl;
        }
      </script>
    </body>
    </html>
  `);
});

// Backward compatibility (Existing mockup endpoints fallback)
router.post("/mock-checkout", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as Request & { user: AuthPayload }).user;
  const { planType } = req.body;
  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const updated = await updateUser(userId, {
      subscriptionStatus: "active",
      planType: planType || "pro",
      stripeCustomerId: "mock_stripe_cust_" + Date.now(),
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Mock checkout error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
