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

await step("home renders carousel rows with prices", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  const rows = await p.locator("main section[aria-label]").count();
  ok(rows >= 4, "rows=" + rows);
  const first = await p.locator("article").first().innerText();
  ok(first.includes("$") && /Guest favourite|in /.test(first), "card text: " + first.slice(0, 40));
});
await step("header: pill collapses on scroll and re-expands on click", async () => {
  ok(await p.locator("[role=search]").count() === 1, "expanded pill missing at top");
  await p.mouse.wheel(0, 700); await p.waitForTimeout(700);
  ok(await p.locator("[role=search]").count() === 0, "did not collapse");
  await p.getByRole("button", { name: "Start your search" }).click(); await p.waitForTimeout(700);
  ok(await p.locator("[role=search]").count() === 1, "did not re-expand");
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
});
await step("carousel title opens filtered results (Cabins) and Reset works", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  await p.getByRole("link", { name: /Cabins & mountain retreats/ }).click(); await p.waitForURL(/category=cabins/);
  await p.waitForTimeout(900); const n = await p.locator("article").count(); ok(n >= 2 && n < 12, "n=" + n);
  await p.getByRole("button", { name: "Reset filters" }).click(); await p.waitForTimeout(900);
  ok(await p.locator("article").count() === 12, "reset shows all homes");
});
await step("amenity chip filters results (Pool)", async () => {
  await p.goto(B + "/?homes=1", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Pool", exact: true }).click(); await p.waitForURL(/amenities=Pool/); await p.waitForTimeout(900);
  const n = await p.locator("article").count(); ok(n >= 2 && n < 12, "n=" + n);
});
await step("search destination via bar", async () => {
  await p.goto(B, { waitUntil: "networkidle" });
  await p.getByPlaceholder("Search destinations").first().fill("paris"); await p.getByRole("button", { name: "Search", exact: true }).click();
  await p.waitForURL(/q=paris/); await p.waitForTimeout(700);
  ok(await p.locator("article").count() === 1, "paris count="+await p.locator("article").count());
});
await step("filters dialog (price) changes results and live count matches", async () => {
  await p.goto(B + "/?homes=1", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /^Filters/ }).first().click();
  await p.locator("#f-max").fill("160"); await p.waitForTimeout(900);
  const label = await p.getByRole("button", { name: /^Show \d+ place/ }).innerText();
  await p.getByRole("button", { name: /^Show \d+ place/ }).click();
  await p.waitForURL(/max_price=160/); await p.waitForTimeout(900);
  const prices = await p.locator("article p.mt-1 span.font-semibold").allInnerTexts();
  ok(prices.length > 0 && prices.every(t => Number(t.replace(/\D/g, "")) <= 160), "prices " + prices);
  const total = Number(label.match(/\d+/)[0]); ok(total >= prices.length, "count " + label);
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
  await p.getByRole("button", { name: "Account", exact: true }).click(); await p.getByRole("menuitemradio", { name: /Lucas Moreau/ }).click();
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
  ok((await p.locator("h1:visible").innerText()) === title, "title");
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
  await p.getByRole("button", { name: "Account", exact: true }).click(); await p.getByRole("menuitemradio", { name: /Priya Nair/ }).click(); await p.waitForTimeout(800);
  ok((await p.locator("main").innerText()).includes("not your listing"), "ownership not enforced in UI");
  await p.getByRole("button", { name: "Account", exact: true }).click(); await p.getByRole("menuitemradio", { name: /Lucas Moreau/ }).click(); await p.waitForTimeout(300);
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
await step("mobile: search sheet applies a destination; tab bar and sticky reserve bar behave", async () => {
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const mp = await m.newPage();
  await mp.goto(B, { waitUntil: "networkidle" });
  await mp.getByRole("button", { name: "Start your search" }).click();
  await mp.locator("#m-where").fill("pari");                                  // typing filters suggestions
  await mp.getByRole("button", { name: /Paris, France/ }).click();            // pick suggestion -> opens When
  await mp.getByRole("button", { name: /^\d+$/ }).nth(20).click().catch(() => {});
  await mp.getByRole("button", { name: "Search", exact: true }).click();
  await mp.waitForURL(/q=Paris/); await mp.waitForTimeout(800);
  ok(await mp.locator("article").count() === 1, "paris results on mobile");
  ok(await mp.getByRole("navigation", { name: "Main" }).isVisible(), "tab bar visible");
  await mp.getByRole("link", { name: "Wishlists" }).click(); await mp.waitForURL(/favorites=1/);
  await mp.goto(B + "/listings/3", { waitUntil: "networkidle" }); await mp.waitForTimeout(500);
  ok(await mp.getByRole("button", { name: /Reserve|Check dates/ }).isVisible(), "sticky reserve bar visible");
  ok(await mp.getByRole("navigation", { name: "Main" }).count() === 0, "tab bar hidden on listing page");
  await m.close();
});
await step("mobile booking bar: Check dates scrolls to card & hides bar; with dates Reserve goes to checkout", async () => {
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const mp = await m.newPage();
  await mp.goto(B + "/listings/3", { waitUntil: "networkidle" }); await mp.waitForTimeout(500);
  const bar = mp.locator("div.fixed.bottom-0", { hasText: "night" });
  ok(await bar.getByRole("button", { name: "Check dates" }).isVisible(), "bar shows Check dates");
  await bar.getByRole("button", { name: "Check dates" }).click(); await mp.waitForTimeout(1200);
  ok(await bar.getAttribute("aria-hidden") === "true", "bar hides while the reservation card is on screen");
  const off = 200 + Math.floor(Math.random() * 100);
  await mp.goto(`${B}/listings/3?check_in=${iso(off)}&check_out=${iso(off + 2)}&guests=2`, { waitUntil: "networkidle" }); await mp.waitForTimeout(600);
  ok((await bar.innerText()).includes("For 2 nights"), "bar shows total for nights: " + (await bar.innerText()).replace(/\n/g, " "));
  await bar.getByRole("button", { name: "Reserve" }).click(); await mp.waitForURL(/checkout\/3/);
  await m.close();
});
await step("image fallback: blocked photos show fallback tiles, layout intact", async () => {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); await c.route("**/_next/image**", r => r.abort());
  const fp = await c.newPage(); const e2 = []; fp.on("pageerror", e => e2.push(e.message));
  await fp.goto(B, { waitUntil: "networkidle" }); await fp.waitForTimeout(1200);
  ok(await fp.locator("[data-image-fallback]").count() >= 7, "home fallbacks=" + await fp.locator("[data-image-fallback]").count());
  ok((await fp.locator("main").innerText()).includes("Guest favourites"), "home text still renders");
  await fp.goto(B + "/listings/3", { waitUntil: "networkidle" }); await fp.waitForTimeout(1000);
  ok(await fp.locator("[data-image-fallback]").count() >= 3, "listing fallbacks");
  ok(await fp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no overflow with broken images");
  ok(e2.length === 0, "page errors: " + e2.join(";")); await c.close();
});
await step("avatars: initials render when there is no photo; host + rules sections present", async () => {
  await p.goto(B + "/listings/3", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  const ini = await p.locator("#reviews [role=img]").first().innerText(); ok(/^[A-Z]{2}$/.test(ini), "reviewer initials: " + ini);
  ok(await p.getByRole("heading", { name: "Meet your host" }).isVisible() || await p.getByRole("heading", { name: "Meet your host" }).count() === 1, "meet host");
  ok(await p.getByRole("heading", { name: "Things to know" }).count() === 1, "things to know");
});
await step("mobile results: Show map / Show list toggle", async () => {
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const mp = await m.newPage();
  await mp.goto(B + "/?homes=1", { waitUntil: "networkidle" }); await mp.waitForTimeout(600);
  await mp.getByRole("button", { name: "Show map" }).click(); await mp.waitForTimeout(1500);
  ok(await mp.getByRole("region", { name: "Map of results" }).isVisible(), "map visible");
  ok(await mp.locator("article").first().isHidden(), "list hidden while map shown");
  await mp.getByRole("button", { name: "Show list" }).click(); await mp.waitForTimeout(500);
  ok(await mp.locator("article").first().isVisible(), "list back");
  await m.close();
});
await step("transparency: disclosure visible on every key page (desktop + mobile), honest title, no card/password fields, no third-party scripts", async () => {
  const pages = ["/", "/?homes=1", "/listings/3", `/checkout/3?check_in=${iso(280)}&check_out=${iso(282)}&guests=2`, "/trips", "/host"];
  for (const [label, ctxOpts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
    const c = await b.newContext(ctxOpts); const t = await c.newPage();
    const scriptHosts = new Set();
    t.on("request", r => { if (r.resourceType() === "script") scriptHosts.add(new URL(r.url()).host); });
    for (const path of pages) {
      await t.goto(B + path, { waitUntil: "networkidle" }); await t.waitForTimeout(500);
      const banner = t.locator("[data-disclosure]");
      ok(await banner.isVisible(), `${label} ${path}: disclosure banner not visible`);
      const text = (await banner.innerText()).toLowerCase();
      ok(text.includes("not affiliated") && text.includes("simulated"), `${label} ${path}: banner wording`);
      const title = await t.title();
      ok(/clone/i.test(title) && !/^Airbnb \|/.test(title), `${label} ${path}: title "${title}"`);
      ok(await t.locator('input[type=password], input[autocomplete^="cc-"], input[name*="card" i], input[name*="cvv" i]').count() === 0, `${label} ${path}: sensitive input present`);
    }
    ok([...scriptHosts].every(h => h === new URL(B).host), `${label}: third-party scripts: ${[...scriptHosts].join(",")}`);
    await c.close();
  }
  await p.goto(`${B}/checkout/3?check_in=${iso(281)}&check_out=${iso(283)}&guests=2`, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  ok((await p.locator("main").innerText()).includes("independent educational demo, not Airbnb"), "checkout notice");
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
