import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * One new account through a whole month: register, set a budget, overspend
 * it, find the expense, read the reports, use the shopping list, switch
 * language, change the password and delete the account. Every run registers
 * a fresh account, so tests never share data.
 */

const uniqueEmail = (project: string) => `e2e-${project}-${randomUUID().slice(0, 8)}@example.test`;

async function addExpense(page: Page, title: string, amount: string, category: string) {
  await page.getByRole("button", { name: "Add expense" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add expense" });
  await dialog.getByLabel("Description").fill(title);
  await dialog.getByLabel("Amount").fill(amount);
  await dialog.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: category }).click();
  await dialog.getByRole("button", { name: "Add expense" }).click();
  await expect(dialog).toBeHidden();
}

test("a new account through a whole month", async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);
  const password = `pw-${randomUUID()}`;
  const newPassword = `pw-${randomUUID()}`;

  await test.step("land and register", async () => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Pace every budget against the month/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).first().click();
    await expect(page).toHaveURL(/\/register$/);
    await page.getByLabel("Name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Your month starts here")).toBeVisible();
  });

  await test.step("set a Food budget", async () => {
    await page.goto("/budgets");
    await page.getByRole("button", { name: "Set a budget for Food" }).click();
    await page.getByLabel("Monthly limit for Food").fill("50");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Food budget saved")).toBeVisible();
    await expect(page.getByRole("meter", { name: /Food/ })).toBeVisible();
  });

  await test.step("overspend it and get warned", async () => {
    await page.goto("/dashboard");
    await addExpense(page, "Groceries", "60", "Food");
    await expect(page.getByText("Food is $10.00 over budget")).toBeVisible();
    await expect(page.getByText("One category is over budget")).toBeVisible();
  });

  await test.step("find, filter and export the expense", async () => {
    await page.goto("/expenses");
    await expect(page.getByRole("row", { name: /Groceries/ })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search entries" }).fill("zzz-nothing");
    await expect(page.getByText("No matching expenses")).toBeVisible();
    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page.getByRole("row", { name: /Groceries/ })).toBeVisible();
    const csv = await page.request.get("/expenses/export");
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("Groceries");
  });

  await test.step("see it in insights", async () => {
    await page.goto("/insights");
    await expect(page.getByRole("heading", { name: /Where your money went/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: "$60.00" }).first()).toBeVisible();
  });

  await test.step("use the shopping list", async () => {
    await page.goto("/shopping");
    await page.getByLabel("Add an item").fill("Milk");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("checkbox", { name: "Milk" }).click();
    await expect(page.getByRole("heading", { name: "Bought" })).toBeVisible();
    await page.getByRole("button", { name: /^Clear/ }).click();
    await expect(page.getByText("Your list is empty")).toBeVisible();
  });

  await test.step("switch to Spanish and back", async () => {
    await page.goto("/settings");
    await page.getByRole("combobox", { name: "Language" }).click();
    await page.getByRole("option", { name: "Español" }).click();
    await page.getByRole("button", { name: "Save" }).nth(1).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
    await page.getByRole("combobox", { name: "Idioma" }).click();
    await page.getByRole("option", { name: "English" }).click();
    await page.getByRole("button", { name: "Guardar" }).nth(1).click();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  await test.step("change the password, then sign in with it", async () => {
    await page.getByLabel("Current password").fill(password);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password changed. Other devices were signed out.")).toBeVisible();

    // This browser stays signed in; a fresh one must use the new password.
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("That email and password don’t match.", { exact: false }),
    ).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  await test.step("delete the account", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    await page.getByLabel("Enter your password to confirm").fill(newPassword);
    await page.getByRole("button", { name: "Delete forever" }).click();
    await expect(page.getByText("Your account and all of its data were deleted.")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test("signed-out visitors are sent to sign in, then back", async ({ page }) => {
  await page.goto("/budgets?month=2026-01");
  await expect(page).toHaveURL(/\/login\?next=%2Fbudgets%3Fmonth%3D2026-01$/);
  await expect(page.getByRole("heading", { name: "Sign in to FundFlow" })).toBeVisible();
});

test("a forged session cookie is rejected", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "ff_session", value: "forged.token.value", url: baseURL ?? "http://localhost:3100" },
  ]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "ff_session")).toBeUndefined();
});

test("the assistant API refuses signed-out requests", async ({ request }) => {
  const res = await request.post("/api/assistant", {
    data: { messages: [{ role: "user", text: "hi" }] },
  });
  expect(res.status()).toBe(401);
});
