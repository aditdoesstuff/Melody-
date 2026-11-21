import { expect, test } from "@playwright/test";

// The three-minute demo path, end to end: Space -> Themes -> Priorities -> Budget -> Identity -> Share -> Invite.
test("a couple can go from an empty start to a shared guide and a queued invite", async ({ page, browser }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  // Landing -> onboarding, no sign-up.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Remember");
  await page.getByRole("link", { name: /Start your wedding journey/ }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your name").fill("Anya");
  await page.getByLabel("Partner's name").fill("Anuj");
  await page.getByLabel("Wedding date").fill("2026-11-19");
  await page.getByLabel("Wedding location").fill("Delhi");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /demo couple/ }).click();
  await page.getByRole("button", { name: "Enter" }).click();
  await page.waitForURL("**/space");

  // Space: add a thought, then search.
  await page.getByLabel("Drop a screenshot, paste a link, or type a thought").fill("fairy lights over the dance floor");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("“fairy lights over the dance floor”")).toBeVisible();
  await page.getByLabel("Search your space").fill("pastel mandap");
  await expect(page.getByText(/\d+ of \d+/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Open: Sage and ivory mandap/ })).toBeVisible();
  await page.getByLabel("Search your space").fill("");

  // Reload keeps everything.
  await page.reload();
  await expect(page.getByText("“fairy lights over the dance floor”")).toBeVisible();

  // Themes.
  await page.goto("/diagnostic");
  await page.getByRole("button", { name: "Find our themes" }).first().click();
  await expect(page.getByRole("heading", { name: /Where family|shared core|closer than|Different instincts|not added/ }).first()).toBeVisible({ timeout: 15_000 });
  const themes = await page.locator("article").count();
  expect(themes).toBeGreaterThanOrEqual(3);
  expect(themes).toBeLessThanOrEqual(5);

  // Priorities -> Budget: moving a category changes its money.
  await page.goto("/budget");
  const photo = page.locator("li", { hasText: "Photography & Video" }).first();
  const before = await photo.locator(".h-serif").first().innerText();
  await page.goto("/priorities");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Move Photography & Video up" }).click();
  await expect(page.getByRole("button", { name: /Drag Photography & Video\. Currently number 1\./ })).toBeVisible();
  await expect(page.getByText(/Photography & Video \d+%/)).toBeVisible();
  await page.waitForTimeout(300); // let the on-device save finish before leaving the page
  await page.goto("/budget");
  const after = await page.locator("li", { hasText: "Photography & Video" }).first().locator(".h-serif").first().innerText();
  expect(after).not.toBe(before);
  await expect(page.locator("li", { hasText: "Photography & Video" }).first()).toContainText("Ranked #1");

  // Identity: sort one, build the guide.
  await page.goto("/identity");
  await page.getByRole("tab", { name: /Keep or not/ }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await page.getByRole("button", { name: /Build our guide|Rebuild our guide/ }).click();
  await expect(page.getByRole("heading", { name: "Anya & Anuj" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Do", exact: true })).toBeVisible();

  // Share: the copied link renders in a clean browser profile with no stored data.
  await page.getByRole("button", { name: "Share" }).click();
  const link = await page.getByLabel("Link").inputValue();
  expect(link).toContain("/share/identity#");
  const other = await browser.newContext();
  const visitor = await other.newPage();
  await visitor.goto(link);
  await expect(visitor.getByRole("heading", { name: "Anya & Anuj" })).toBeVisible();
  await expect(visitor.getByText(/celebration that feels like/)).toBeVisible();
  await expect(visitor.getByRole("link", { name: /Make yours on aaroh/ })).toBeVisible();
  await other.close();
  await page.keyboard.press("Escape");

  // Invites: the queue builds a real WhatsApp deep link with the personalised message.
  await page.goto("/invites");
  await page.getByRole("button", { name: "Ready to send" }).first().click();
  const open = page.getByRole("link", { name: "Open WhatsApp" });
  const href = await open.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hi%20/);
  expect(decodeURIComponent(href!)).toContain("Anya & Anuj");
  await page.getByRole("button", { name: "SMS" }).click();
  expect(await page.getByRole("link", { name: "Open Messages" }).getAttribute("href")).toMatch(/^sms:\+\d+\?&body=Hi%20/);
  await page.getByRole("button", { name: "Skip" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText(/Skipped .* · Engagement Invite/)).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});
