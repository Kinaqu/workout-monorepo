import { expect, request as playwrightRequest, test, type Page } from '@playwright/test';

const expectClerkKey = process.env.EXPECT_CLERK_PUBLISHABLE_KEY === 'true';
const configuredBaseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassHeaders = bypassSecret
  ? {
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : undefined;

async function enableVercelProtectionBypass(page: Page) {
  if (!bypassHeaders) {
    return;
  }

  const origin = new URL(configuredBaseUrl).origin;

  await page.route('**/*', async route => {
    const request = route.request();

    if (request.url().startsWith(origin)) {
      await route.continue({
        headers: {
          ...request.headers(),
          ...bypassHeaders,
        },
      });
      return;
    }

    await route.continue();
  });
}

function attachClientIssueCollector(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const sameOriginFailures: string[] = [];

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    const url = new URL(request.url());

    const isSameOrigin = url.origin === new URL(configuredBaseUrl).origin;
    const isInternalBypassProbe = url.pathname === '/.well-known/vercel/jwe';
    const isNavigationHeadRequest = request.method() === 'HEAD';

    if (isSameOrigin && !isInternalBypassProbe && !isNavigationHeadRequest) {
      sameOriginFailures.push(`${request.method()} ${url.pathname} ${failure?.errorText ?? 'request failed'}`);
    }
  });

  return { pageErrors, consoleErrors, sameOriginFailures };
}

async function assertNoClientIssues(issues: ReturnType<typeof attachClientIssueCollector>) {
  expect.soft(issues.pageErrors, 'page errors').toEqual([]);
  expect.soft(issues.consoleErrors, 'console errors').toEqual([]);
  expect.soft(issues.sameOriginFailures, 'same-origin failed requests').toEqual([]);
}

async function expectAuthPageHealthy(page: Page, route: '/login' | '/register', titlePart: string) {
  await enableVercelProtectionBypass(page);
  const issues = attachClientIssueCollector(page);

  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(new RegExp(titlePart, 'i'));
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('main.auth-container')).toBeVisible();
  await page.waitForTimeout(750);

  if (expectClerkKey) {
    await expect(page.getByText('Clerk key is missing')).toHaveCount(0);
  } else {
    await expect(page.getByText('Clerk key is missing')).toBeVisible();
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await assertNoClientIssues(issues);
}

test('serves required public assets', async ({ request }) => {
  const assetPaths = [
    '/manifest.json',
    '/sw.js',
    '/favicon.svg',
    '/icons/workout-logo.svg',
  ];

  const protectedRequest = bypassHeaders
    ? await playwrightRequest.newContext({
        baseURL: configuredBaseUrl,
        extraHTTPHeaders: bypassHeaders,
      })
    : request;

  for (const path of assetPaths) {
    const response = await protectedRequest.get(path);
    expect(response.ok(), `${path} should return 2xx`).toBeTruthy();
  }

  if (protectedRequest !== request) {
    await protectedRequest.dispose();
  }
});

test('redirects unauthenticated users from root to login', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  const issues = attachClientIssueCollector(page);

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await page.waitForURL(/\/login(?:[/?#]|$)/);
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
  await expect(page.locator('main.auth-container')).toBeVisible();

  if (expectClerkKey) {
    await expect(page.getByText('Clerk key is missing')).toHaveCount(0);
  }

  await assertNoClientIssues(issues);
});

test('login page renders cleanly', async ({ page }) => {
  await expectAuthPageHealthy(page, '/login', 'Login');
});

test('register page renders cleanly', async ({ page }) => {
  await expectAuthPageHealthy(page, '/register', 'Sign Up');
});
