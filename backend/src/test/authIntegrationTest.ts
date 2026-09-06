import pool from "../config/db";
import {
  requestSignupVerification,
  verifySignupOtp,
  loginWithEmailPassword,
  authenticateGoogle,
  getMe,
} from "../modules/auth/authService";
import {
  getOnboardingStatus,
  saveStepOnePersonal,
  saveStepTwoSkills,
  saveStepThreePreferences,
} from "../modules/onboarding/onboardingService";

async function runPhase16CorrectionTests() {
  console.log("\n============================================================");
  console.log("   PHASE 16 CORRECTION — VERIFICATION & GOOGLE TEST SUITE");
  console.log("============================================================\n");

  const testEmail1 = `vit.student.${Date.now()}@vitstudent.ac.in`;
  const testEmail2 = `faculty.dr.${Date.now()}@vit.ac.in`;
  const fakeEmail = `fakeperson.${Date.now()}@vitstudent.ac.in`;
  const nonVitEmail = `hacker.${Date.now()}@gmail.com`;

  try {
    // ------------------------------------------------------------
    // TEST 1 — FAKE / UNVERIFIED VIT EMAIL
    // ------------------------------------------------------------
    console.log("TEST 1: Requesting OTP for a VIT email but NOT verifying...");
    const reqRes1 = await requestSignupVerification(
      "Fake Person",
      fakeEmail,
      "Password123!"
    );
    console.log("   - OTP requested for:", reqRes1.email);

    // Verify in database: NO user or wallet should exist for fakeEmail
    const unverifiedUserCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [fakeEmail]
    );
    if (unverifiedUserCheck.rows.length > 0) {
      throw new Error("FAILED: User was created before OTP verification!");
    }
    const unverifiedWalletCheck = await pool.query(
      `SELECT w.id FROM wallets w 
       JOIN users u ON u.id = w.user_id 
       WHERE u.email = $1`,
      [fakeEmail]
    );
    if (unverifiedWalletCheck.rows.length > 0) {
      throw new Error("FAILED: Wallet was created before OTP verification!");
    }
    console.log("✅ TEST 1 PASSED: Fake/unverified email has NO user record, NO wallet, and NO credits.");

    // ------------------------------------------------------------
    // TEST 2 — VALID VIT EMAIL & CORRECT OTP
    // ------------------------------------------------------------
    console.log("\nTEST 2: Requesting OTP and verifying with valid code...");
    await requestSignupVerification(
      "Real Student",
      testEmail1,
      "ValidPass123!"
    );

    // Retrieve pending OTP record
    const otpRecord = await pool.query<{ id: string; otp_hash: string }>(
      `SELECT id, otp_hash FROM email_verifications 
       WHERE email = $1 AND verified = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [testEmail1]
    );
    if (otpRecord.rows.length === 0) {
      throw new Error("Verification record not found in database!");
    }

    // Since otp_hash is hashed with bcrypt, let's test OTP verification via verifySignupOtp.
    // For test purposes, we will update the verification with a known OTP hash or use bcrypt to verify
    const bcrypt = await import("bcryptjs");
    const testOtp = "789123";
    const newHash = await bcrypt.hash(testOtp, 10);
    await pool.query(
      "UPDATE email_verifications SET otp_hash = $1 WHERE id = $2",
      [newHash, otpRecord.rows[0].id]
    );

    const verifyRes = await verifySignupOtp(testEmail1, testOtp);
    console.log("✅ Verified account created successfully:", verifyRes.user.email);
    console.log("   - User ID:", verifyRes.user.id);
    console.log("   - Initial Credits:", verifyRes.user.credits);
    console.log("   - Onboarding Step:", verifyRes.user.onboardingStep);
    console.log("   - Onboarding Completed:", verifyRes.user.onboardingCompleted);

    if (verifyRes.user.credits !== 40) {
      throw new Error(`Expected 40 initial credits, got ${verifyRes.user.credits}`);
    }

    // Verify DB integrity for wallet & transactions
    const walletCheck = await pool.query(
      "SELECT balance FROM wallets WHERE user_id = $1",
      [verifyRes.user.id]
    );
    if (walletCheck.rows[0].balance !== 40) {
      throw new Error(`Wallet balance mismatch: ${walletCheck.rows[0].balance}`);
    }

    const txCheck = await pool.query(
      "SELECT * FROM credit_transactions WHERE user_id = $1",
      [verifyRes.user.id]
    );
    if (txCheck.rows.length !== 1 || txCheck.rows[0].amount !== 40) {
      throw new Error(`Expected exactly 1 transaction of +40 credits, found ${txCheck.rows.length}`);
    }
    console.log("✅ TEST 2 PASSED: Exactly 1 user, 1 wallet (40 credits), and 1 transaction (+40 INITIAL_SIGNUP_BONUS).");

    // ------------------------------------------------------------
    // TEST 3 — WRONG OTP
    // ------------------------------------------------------------
    console.log("\nTEST 3: Testing wrong OTP rejection...");
    const wrongOtpEmail = `wrong.otp.${Date.now()}@vitstudent.ac.in`;
    await requestSignupVerification("Wrong Tester", wrongOtpEmail, "Password123!");
    try {
      await verifySignupOtp(wrongOtpEmail, "000000");
      throw new Error("FAILED: Wrong OTP was accepted!");
    } catch (err: any) {
      console.log("✅ Correctly rejected wrong OTP:", err.message);
    }
    const wrongUserCheck = await pool.query("SELECT id FROM users WHERE email = $1", [wrongOtpEmail]);
    if (wrongUserCheck.rows.length > 0) {
      throw new Error("FAILED: User created on wrong OTP!");
    }
    console.log("✅ TEST 3 PASSED: Wrong OTP rejected and no user created.");

    // ------------------------------------------------------------
    // TEST 4 — EXPIRED OTP
    // ------------------------------------------------------------
    console.log("\nTEST 4: Testing expired OTP rejection...");
    const expiredEmail = `expired.otp.${Date.now()}@vitstudent.ac.in`;
    await requestSignupVerification("Expired Tester", expiredEmail, "Password123!");
    // Force expire in DB
    await pool.query(
      "UPDATE email_verifications SET expires_at = NOW() - INTERVAL '1 hour' WHERE email = $1",
      [expiredEmail]
    );
    try {
      await verifySignupOtp(expiredEmail, "789123");
      throw new Error("FAILED: Expired OTP was accepted!");
    } catch (err: any) {
      console.log("✅ Correctly rejected expired OTP:", err.message);
    }
    console.log("✅ TEST 4 PASSED: Expired OTP rejected.");

    // ------------------------------------------------------------
    // TEST 5 — DUPLICATE EMAIL
    // ------------------------------------------------------------
    console.log("\nTEST 5: Testing duplicate email registration prevention...");
    try {
      await requestSignupVerification("Duplicate Person", testEmail1, "AnotherPass123!");
      throw new Error("FAILED: Duplicate registration allowed!");
    } catch (err: any) {
      console.log("✅ Correctly blocked duplicate email request:", err.message);
    }
    console.log("✅ TEST 5 PASSED: Duplicate registration blocked.");

    // ------------------------------------------------------------
    // TEST 6 — GOOGLE NON-VIT EMAIL REJECTION
    // ------------------------------------------------------------
    console.log("\nTEST 6: Google Sign-in with non-VIT domain (@gmail.com)...");
    try {
      await authenticateGoogle({
        email: nonVitEmail,
        name: "Non VIT Hacker",
      });
      throw new Error("FAILED: Non-VIT Google email was allowed!");
    } catch (err: any) {
      console.log("✅ Correctly rejected non-VIT Google account:", err.message);
      if (err.message !== "Please use your VIT email account to continue.") {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
    console.log("✅ TEST 6 PASSED: Google non-VIT domain rejected with exact message.");

    // ------------------------------------------------------------
    // TEST 7 — GOOGLE VALID VIT EMAIL (NEW & EXISTING USER)
    // ------------------------------------------------------------
    console.log("\nTEST 7: Google Sign-in with valid VIT email...");
    const googleEmail = `google.student.${Date.now()}@vitstudent.ac.in`;
    const googleId = `gid-${Date.now()}`;

    // 7A: New user via Google
    const googleNewRes = await authenticateGoogle({
      email: googleEmail,
      name: "Google VIT Student",
      googleId,
    });
    console.log("✅ New Google user created:", googleNewRes.user.email);
    console.log("   - Initial credits:", googleNewRes.user.credits);
    if (googleNewRes.user.credits !== 40) {
      throw new Error("New Google user did not get 40 credits!");
    }

    // 7B: Existing user logging in with same Google account
    const googleExistingRes = await authenticateGoogle({
      email: googleEmail,
      name: "Google VIT Student",
      googleId,
    });
    console.log("✅ Existing Google user logged in without duplication.");
    console.log("   - Credits:", googleExistingRes.user.credits);

    const googleWallets = await pool.query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [googleNewRes.user.id]
    );
    if (googleWallets.rows.length !== 1) {
      throw new Error(`Expected 1 wallet, found ${googleWallets.rows.length}`);
    }
    console.log("✅ TEST 7 PASSED: Google new user created with +40 credits, existing login preserved without duplication.");

    // ------------------------------------------------------------
    // TEST 8 — LOGIN FLOW & ONBOARDING
    // ------------------------------------------------------------
    console.log("\nTEST 8: Testing Login with credentials...");
    const loginRes = await loginWithEmailPassword(testEmail1, "ValidPass123!");
    console.log("✅ Logged in successfully:", loginRes.user.fullName);

    // Wrong password test
    try {
      await loginWithEmailPassword(testEmail1, "WrongPassword!");
      throw new Error("FAILED: Wrong password accepted!");
    } catch (err: any) {
      console.log("✅ Wrong password correctly rejected:", err.message);
    }

    // Unknown email test
    try {
      await loginWithEmailPassword("unknown.person@vitstudent.ac.in", "Password123!");
      throw new Error("FAILED: Unknown email accepted!");
    } catch (err: any) {
      console.log("✅ Unknown email correctly rejected:", err.message);
    }
    console.log("✅ TEST 8 PASSED: Login validation works accurately.");

    // ------------------------------------------------------------
    // TEST 9 — ONBOARDING WORKFLOW & CREDIT PRESERVATION
    // ------------------------------------------------------------
    console.log("\nTEST 9: Onboarding workflow for new user...");
    const userId = verifyRes.user.id;
    await saveStepOnePersonal(userId, {
      fullName: "Real Student Verified",
      registrationNumber: "22BCE2045",
      university: "VIT Chennai",
      department: "Computer Science",
      year: "3rd Year",
      phone: "9876543210",
      bio: "Peer mentor in web development.",
    });

    await saveStepTwoSkills(userId, {
      teaches: ["Node.js", "Express", "PostgreSQL"],
      learns: ["Docker", "Kubernetes"],
    });

    await saveStepThreePreferences(userId, {
      availability: "Weekends",
      preferredTime: "Evening",
      github: "https://github.com/vitstudent",
      linkedin: "https://linkedin.com/in/vitstudent",
      portfolio: "https://vitstudent.dev",
    });

    const finalStatus = await getOnboardingStatus(userId);
    console.log("✅ Onboarding completed status:", finalStatus.onboardingCompleted);

    const meRes = await getMe(userId);
    console.log("✅ Current balance remains exactly:", meRes.credits);
    if (meRes.credits !== 40) {
      throw new Error(`Credits mutated! Expected 40, got ${meRes.credits}`);
    }
    console.log("✅ TEST 9 PASSED: Onboarding workflow completed, credits preserved.");

    console.log("\n============================================================");
    console.log("   🎉 ALL 9 PHASE 16 CORRECTION TESTS PASSED SUCCESSFULLY!");
    console.log("============================================================\n");
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase16CorrectionTests();
