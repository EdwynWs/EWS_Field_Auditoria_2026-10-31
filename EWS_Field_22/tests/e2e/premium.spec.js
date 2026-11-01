import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
for (const width of [360, 390, 430, 768, 1024, 1440, 1920])
  test(`V5 at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "operação externa.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const tabs = page.getByRole("tab");
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tabs.nth(2)).toBeFocused();
    await tabs.nth(0).click();
    if (width <= 1050) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(
        page.getByRole("navigation", { name: "Navegação principal" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toBeFocused();
    }
    for (const id of [
      "plataforma",
      "funcionalidades",
      "como-funciona",
      "segmentos",
      "seguranca",
      "contato",
    ])
      await expect(page.locator("#" + id)).toHaveCount(1);
    if (process.env.VISUAL_QA_DIR) {
      await mkdir(process.env.VISUAL_QA_DIR, { recursive: true });
      await page.addStyleTag({ content: "nextjs-portal{display:none}" });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `${process.env.VISUAL_QA_DIR}/landing-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
test("lead failure allows retry without losing input", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/leads", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Serviço indisponível."}',
    }),
  );
  await page.getByLabel("Seu nome").fill("Pessoa Demo");
  await page.getByLabel("Empresa", { exact: true }).fill("Empresa Demo");
  await page.getByLabel("E-mail corporativo").fill("demo@example.test");
  await page.getByLabel(/Autorizo a EWS Tech/).check();
  await page
    .getByRole("button", { name: "Solicitar demonstração", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "indisponível",
  );
  await expect(page.getByLabel("Seu nome")).toHaveValue("Pessoa Demo");
  await expect(
    page.getByRole("button", { name: "Solicitar demonstração", exact: true }),
  ).toBeEnabled();
});
test("FAQ works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator("summary").last().click();
  await expect(page.locator("details[open]")).toContainText("Ainda não");
  await context.close();
});
