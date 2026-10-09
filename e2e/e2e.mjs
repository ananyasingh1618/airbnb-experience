import { chromium } from "playwright-core";
const B = "http://localhost:3000";
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("PAGEERR " + e.message));
p.on("console", m => m.type()==="error" && !/hydrat|Failed to load resource/.test(m.text()) && errs.push(m.text().slice(0,200)));
const iso = d => { const x = new Date(); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); };
const off = 150 + Math.floor(Math.random()*150);
const step = async (name, fn) => { try { await fn(); console.log("PASS", name); } catch (e) { console.log("FAIL", name, "-", e.message.split("\n")[0]); } };
const ok = (c, m) => { if (!c) throw new Error(m); };

await step("home renders 12 cards w/ prices", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  ok(await p.locator("article").count() === 12, "cards="+await p.locator("article").count());
  ok((await p.locator("article").first().innerText()).includes("$"), "no price");
});
await step("header: pill collapses on scroll and re-expands on click", async () => {
  ok(await p.locator("[role=search]").count() === 1, "expanded pill missing at top");
  await p.mouse.wheel(0, 700); await p.waitForTimeout(700);
  ok(await p.locator("[role=search]").count() === 0, "did not collapse");
  await p.getByRole("button", { name: "Start your search" }).click(); await p.waitForTimeout(700);
  ok(await p.locator("[role=search]").count() === 1, "did not re-expand");
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
});
await step("category filter (Cabins)", async () => {
  await p.getByRole("button", { name: "Cabins" }).click(); await p.waitForURL(/category=cabins/);
  await p.waitForTimeout(700); const n = await p.locator("article").count(); ok(n>=2 && n<12, "n="+n);
  await p.getByRole("button", { name: "Reset filters" }).click(); await p.waitForTimeout(700);
});
await step("search destination via bar", async () => {
  await p.getByPlaceholder("Search destinations").first().fill("paris"); await p.getByRole("button", { name: "Search", exact: true }).click();
  await p.waitForURL(/q=paris/); await p.waitForTimeout(700);
  ok(await p.locator("article").count() === 1, "paris count="+await p.locator("article").count());
});
await step("filters dialog (price+amenity) changes results", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /^Filters/ }).first().click();
  await p.locator("#f-max").fill("160"); await p.getByRole("button", { name: "Show results" }).click();
  await p.waitForURL(/max_price=160/); await p.waitForTimeout(700);
  const prices = await p.locator("article p.mt-1 span.font-semibold").allInnerTexts();
  ok(prices.length>0 && prices.every(t => Number(t.replace(/\D/g,"")) <= 160), "prices "+prices);
});
await step("favorite toggle persists across reload & not navigate", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  const btn = p.locator("article").nth(3).getByRole("button", { name: /favorites/ });
  const before = await btn.getAttribute("aria-pressed"); await btn.click(); await p.waitForTimeout(600);
  ok(p.url() === B + "/", "navigated: "+p.url());
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(500);
  const after = await p.locator("article").nth(3).getByRole("button", { name: /favorites/ }).getAttribute("aria-pressed");
  ok(before !== after, `before=${before} after=${after}`);
  await p.locator("article").nth(3).getByRole("button", { name: /favorites/ }).click(); await p.waitForTimeout(400);
});
let ref;
await step("listing → dates → reserve → checkout → confirm", async () => {
  await p.goto(`${B}/listings/12?check_in=${iso(off)}&check_out=${iso(off+3)}&guests=2`, { waitUntil: "networkidle" });
  ok((await p.locator("aside").innerText()).includes("Total"), "no total");
  await p.getByRole("button", { name: "Reserve" }).click(); await p.waitForURL(/checkout\/12/);
  await p.getByRole("button", { name: /Confirm and book/ }).dblclick(); // double click on purpose
  await p.waitForURL(/booking-confirmation\/\d+/, { timeout: 8000 });
  ref = (await p.locator("p", { hasText: "Reservation" }).first().innerText()); console.log("   ", ref.replace(/\n/g," "));
});
await step("My Trips shows booking", async () => {
  await p.goto(`${B}/trips`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  ok((await p.locator("main").innerText()).includes("Sunlit apartment"), "not listed");
  ok(await p.locator("article", { hasText: "Sunlit apartment" }).count() >= 2, "expected seeded past + new");
});
await step("dates now blocked + 409 shown on direct checkout", async () => {
  await p.goto(`${B}/checkout/12?check_in=${iso(off+1)}&check_out=${iso(off+2)}&guests=2`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  ok((await p.locator("main").innerText()).includes("no longer available"), "no conflict msg");
  ok(await p.getByRole("button", { name: /Confirm and book/ }).isDisabled(), "button enabled");
});
await step("past / invalid dates rejected", async () => {
  await p.goto(`${B}/checkout/12?check_in=2020-01-01&check_out=2020-01-03&guests=2`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  ok((await p.locator("main").innerText()).includes("past"), (await p.locator("main").innerText()).slice(0,100));
});
await step("not-found listing", async () => {
  await p.goto(`${B}/listings/9999`, { waitUntil: "networkidle" }); await p.waitForTimeout(400);
  ok((await p.locator("main").innerText()).includes("couldn't find"), "no nf");
});
await step("switch to host via menu; host dashboard", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Account menu" }).click(); await p.getByRole("menuitemradio", { name: /Lucas Moreau/ }).click();
  await p.goto(`${B}/host`, { waitUntil: "networkidle" }); await p.waitForTimeout(600);
  ok((await p.locator("main").innerText()).includes("Host dashboard"), "no dash");
  ok((await p.locator("table").innerText()).includes("Maya Chen"), "guest booking not in host table");
});
const title = "E2E Test Cabin " + Date.now();
await step("host creates listing (validation then success)", async () => {
  await p.goto(`${B}/host/listings/new`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Create listing" }).click(); await p.waitForTimeout(300);
  ok(await p.getByRole("alert").count() >= 3, "no validation errors");
  await p.fill("#f-title", title); await p.fill("#f-description", "A cosy test cabin created by the end-to-end suite.");
  await p.fill("#f-location", "Testville, Norway"); await p.fill("#f-price", "99.50"); await p.fill("#f-cleaning", "20");
  await p.fill("#f-images", "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=80");
  await p.getByRole("button", { name: "Wifi" }).click();
  await p.getByRole("button", { name: "Create listing" }).click(); await p.waitForURL(/listings\/\d+$/, { timeout: 8000 });
  ok((await p.locator("h1").innerText()) === title, "title");
});
await step("new listing appears in Explore search", async () => {
  await p.goto(`${B}/?q=Testville`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  ok(await p.locator("article").count() === 1, "count");
});
await step("host edits listing", async () => {
  await p.goto(`${B}/host`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  await p.locator("li", { hasText: title }).getByRole("link", { name: "Edit" }).click(); await p.waitForURL(/edit/);
  await p.waitForSelector("#f-title"); await p.fill("#f-price", "120"); await p.getByRole("button", { name: "Save changes" }).click();
  await p.waitForURL(/\/host$/); await p.waitForTimeout(600);
  ok((await p.locator("li", { hasText: title }).innerText()).includes("$120"), "price not updated");
});
await step("other host cannot edit (Priya)", async () => {
  const url = p.url(); await p.locator("li", { hasText: title }).getByRole("link", { name: "Edit" }).click(); await p.waitForURL(/edit/);
  const editUrl = p.url();
  await p.getByRole("button", { name: "Account menu" }).click(); await p.getByRole("menuitemradio", { name: /Priya Nair/ }).click(); await p.waitForTimeout(800);
  ok((await p.locator("main").innerText()).includes("not your listing"), "ownership not enforced in UI");
  await p.getByRole("button", { name: "Account menu" }).click(); await p.getByRole("menuitemradio", { name: /Lucas Moreau/ }).click(); await p.waitForTimeout(300);
});
await step("host deletes listing; booked listing blocked", async () => {
  await p.goto(`${B}/host`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  await p.locator("li", { hasText: title }).getByRole("button", { name: "Delete" }).click();
  await p.getByRole("button", { name: "Delete listing" }).click(); await p.waitForTimeout(800);
  ok(await p.locator("li", { hasText: title }).count() === 0, "still there");
  await p.locator("li", { hasText: "Sunlit apartment" }).getByRole("button", { name: "Delete" }).click();
  await p.getByRole("button", { name: "Delete listing" }).click(); await p.waitForTimeout(800);
  ok((await p.getByRole("dialog").innerText()).includes("booking history"), "no block msg");
});
await step("mobile 390px: no horizontal overflow on key pages", async () => {
  const m = await b.newContext({ viewport: { width: 390, height: 800 } }); const mp = await m.newPage();
  for (const path of ["/", "/listings/3", "/trips", "/host"]) {
    await mp.goto(B + path, { waitUntil: "networkidle" }); await mp.waitForTimeout(400);
    const w = await mp.evaluate(() => document.documentElement.scrollWidth); ok(w <= 391, `${path} scrollWidth=${w}`);
  }
  await mp.goto(B, { waitUntil: "networkidle" }); await mp.screenshot({ path: "/tmp/mobile-home.png" });
  await mp.goto(`${B}/listings/3?check_in=${iso(off+20)}&check_out=${iso(off+22)}`, { waitUntil: "networkidle" }); await mp.screenshot({ path: "/tmp/mobile-detail.png" });
});
console.log("console errors:", JSON.stringify(errs.slice(0,5)));
await b.close();
