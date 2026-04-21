import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const ROOT_BASE = "http://localhost:3000";
const MERCHANT_BASE = "http://merchant.localhost:3000";
const OUT = "screenshots";

// [filename, path, base, role]
const PAGES = [
  ["01-login.png",                    "/login",     ROOT_BASE,     null],

  ["10-merchant-dashboard.png",       "/",          MERCHANT_BASE, "manager"],
  ["11-merchant-approvals.png",       "/approvals", MERCHANT_BASE, "manager"],
  ["12-merchant-owners.png",          "/owners",    MERCHANT_BASE, "manager"],
  ["13-merchant-vehicles.png",        "/vehicles",  MERCHANT_BASE, "manager"],
  ["14-merchant-drivers.png",         "/drivers",   MERCHANT_BASE, "manager"],
  ["15-merchant-users.png",           "/users",     MERCHANT_BASE, "manager"],

  ["20-merchant-approvals-admin.png", "/approvals", MERCHANT_BASE, "admin"],

  ["30-admin-dashboard.png",          "/",          ROOT_BASE,     "superadmin"],
  ["31-admin-merchants.png",          "/merchants", ROOT_BASE,     "superadmin"],
];

async function login(browser, email) {
  const page = await browser.newPage();
  await page.goto(`${ROOT_BASE}/login`, { waitUntil: "networkidle0" });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "password123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('button[type="submit"]'),
  ]);
  const all = await browser.cookies();
  await page.close();
  const tok = all.find((c) => c.name === "authjs.session-token");
  if (!tok) throw new Error(`Login failed: ${email}`);
  return tok.value;
}

async function setSessionForHost(browser, token, domain) {
  await browser.setCookie({
    name: "authjs.session-token",
    value: token,
    domain,
    path: "/",
    httpOnly: true,
  });
}

async function clearAuthCookies(browser) {
  const all = await browser.cookies();
  const auth = all.filter((c) => c.name.startsWith("authjs."));
  if (auth.length) await browser.deleteCookie(...auth);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  console.log("Logging in…");
  const tokens = {};
  for (const role of ["manager", "admin", "superadmin"]) {
    await clearAuthCookies(browser);
    tokens[role] = await login(browser, `${role}@explorin.co.id`);
  }
  await clearAuthCookies(browser);

  console.log("\nCapturing pages:");
  for (const [file, pathname, base, role] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    await clearAuthCookies(browser);
    if (role) {
      // Set the cookie for both hostnames so either base works.
      await setSessionForHost(browser, tokens[role], "localhost");
      await setSessionForHost(browser, tokens[role], "merchant.localhost");
    }

    try {
      await page.goto(`${base}${pathname}`, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
      await page.screenshot({ path: path.join(OUT, file), fullPage: true });
      console.log(`  ${file}  (${base}${pathname})`);
    } catch (e) {
      console.error(`  FAILED ${file}: ${e.message}`);
    }
    await page.close();
  }

  await browser.close();
  console.log("\nDone → ./screenshots/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
