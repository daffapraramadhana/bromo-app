import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const ROOT_BASE = "http://localhost:3000";
const MERCHANT_BASE = "http://merchant.localhost:3000";
const OUT = "screenshots";

async function login(browser, email) {
  const page = await browser.newPage();
  await page.goto(`${ROOT_BASE}/login`, { waitUntil: "networkidle0" });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "password123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('button[type="submit"]'),
  ]);
  const cookies = await browser.cookies();
  await page.close();
  const tok = cookies.find((c) => c.name === "authjs.session-token");
  if (!tok) throw new Error(`Login failed: ${email}`);
  return tok.value;
}

async function setSession(browser, token) {
  for (const domain of ["localhost", "merchant.localhost"]) {
    await browser.setCookie({
      name: "authjs.session-token",
      value: token,
      domain,
      path: "/",
      httpOnly: true,
    });
  }
}

async function clearAuthCookies(browser) {
  const all = await browser.cookies();
  const auth = all.filter((c) => c.name.startsWith("authjs."));
  if (auth.length) await browser.deleteCookie(...auth);
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  console.log(`  → ${file}`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  console.log("Login as admin…");
  const adminToken = await login(browser, "admin@explorin.co.id");

  // --- Test 1: Zod validation error — submit empty form ---
  console.log("\nTest 1: Submit empty Owner form (expect inline validation)");
  await clearAuthCookies(browser);
  await setSession(browser, adminToken);
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto(`${MERCHANT_BASE}/owners/new`, { waitUntil: "networkidle0" });
    // Remove `required` so the browser doesn't block; we want the server to validate.
    await page.evaluate(() => {
      document.querySelectorAll("input[required], select[required]").forEach((el) => el.removeAttribute("required"));
    });
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST", { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
    await new Promise((r) => setTimeout(r, 400));
    await shot(page, "50-owner-empty-validation.png");

    const errText = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".text-destructive"))
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .slice(0, 6),
    );
    console.log("  error texts:", errText);
    await page.close();
  }

  // --- Test 2: Duplicate key error — try to create a driver with the existing NIK/SIM ---
  console.log("\nTest 2: Duplicate NIK on Driver create");
  await clearAuthCookies(browser);
  await setSession(browser, adminToken);
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto(`${MERCHANT_BASE}/drivers/new`, { waitUntil: "networkidle0" });
    await page.type('input[name="nama"]', "Tes Duplikat");
    await page.type('input[name="nik"]', "3502011205900001"); // seed: Agus Pratama
    await page.type('input[name="noSim"]', "B9999999");
    await page.select('select[name="jenisSim"]', "B1");
    await page.type('input[name="masaBerlakuSim"]', "12-12-2027");
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST", { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
    await new Promise((r) => setTimeout(r, 400));
    await shot(page, "51-driver-duplicate-nik.png");
    const errText = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".text-destructive"))
        .map((n) => n.textContent?.trim())
        .filter(Boolean),
    );
    console.log("  error texts:", errText);
    await page.close();
  }

  // --- Test 3: Edit page renders with prefilled values ---
  console.log("\nTest 3: Edit pages render with prefilled values");
  await clearAuthCookies(browser);
  await setSession(browser, adminToken);
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1200 });
    await page.goto(`${MERCHANT_BASE}/owners/1/edit`, { waitUntil: "networkidle0" });
    await shot(page, "60-owner-edit.png");
    await page.goto(`${MERCHANT_BASE}/drivers/1/edit`, { waitUntil: "networkidle0" });
    await shot(page, "61-driver-edit.png");
    await page.goto(`${MERCHANT_BASE}/vehicles/1/edit`, { waitUntil: "networkidle0" });
    await shot(page, "62-vehicle-edit.png");
    await page.close();
  }

  // --- Test 4: Detail page shows Edit button ---
  console.log("\nTest 4: Detail pages show Edit button");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${MERCHANT_BASE}/owners/1`, { waitUntil: "networkidle0" });
    await shot(page, "41-owner-detail.png");
    await page.goto(`${MERCHANT_BASE}/drivers/1`, { waitUntil: "networkidle0" });
    await shot(page, "43-driver-detail.png");
    await page.goto(`${MERCHANT_BASE}/vehicles/1`, { waitUntil: "networkidle0" });
    await shot(page, "45-vehicle-detail.png");
    await page.close();
  }

  // --- Test 5: Happy path — create a new owner with 2 vehicles ---
  console.log("\nTest 5: Create owner with 2 vehicles end-to-end");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1200 });
    await page.goto(`${MERCHANT_BASE}/owners/new`, { waitUntil: "networkidle0" });
    await page.type('input[name="nama"]', "Pak Test E2E");
    await page.select('select[name="tipePemilik"]', "individu");
    await page.type('input[name="nik"]', "9999888877776666");
    await page.type('input[name="noHp"]', "0811111111");
    await page.click('button:has-text("+ Tambah kendaraan")').catch(async () => {
      // fall back: find by text
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const add = btns.find((b) => b.textContent?.includes("Tambah kendaraan"));
        add?.click();
      });
    });
    await new Promise((r) => setTimeout(r, 100));
    await page.type('input[name="vehicle[0][merk]"]', "Toyota");
    await page.type('input[name="vehicle[0][tipe]"]', "Hardtop E2E-1");
    await page.type('input[name="vehicle[0][tahunPembuatan]"]', "1990");
    await page.type('input[name="vehicle[0][noPolisi]"]', "N 1111 ZA");
    await page.type('input[name="vehicle[0][noRangka]"]', "E2E-R-1");
    await page.type('input[name="vehicle[0][noMesin]"]', "E2E-M-1");
    await page.type('input[name="vehicle[1][merk]"]', "Mitsubishi");
    await page.type('input[name="vehicle[1][tipe]"]', "Willys E2E-2");
    await page.type('input[name="vehicle[1][tahunPembuatan]"]', "1985");
    await page.type('input[name="vehicle[1][noPolisi]"]', "N 2222 ZB");
    await page.type('input[name="vehicle[1][noRangka]"]', "E2E-R-2");
    await page.type('input[name="vehicle[1][noMesin]"]', "E2E-M-2");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('button[type="submit"]'),
    ]);
    await shot(page, "70-owner-created-with-vehicles.png");
    const url = page.url();
    console.log("  redirected to:", url);
    await page.close();
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
