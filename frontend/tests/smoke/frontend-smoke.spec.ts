import { expect, request as playwrightRequest, test, type Page } from '@playwright/test';

const expectClerkKey = process.env.EXPECT_CLERK_PUBLISHABLE_KEY === 'true';
const configuredBaseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const apiOrigin = 'https://workout-api.dimer133745.workers.dev';
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

  await page.setExtraHTTPHeaders(bypassHeaders);
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

async function installLegacySession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'smoke-test-token');
  });
}

function buildMeResponse({
  onboardingCompleted,
  hasActiveProgram,
}: {
  onboardingCompleted: boolean;
  hasActiveProgram: boolean;
}) {
  return {
    user: {
      id: 'user_smoke',
      username: 'smoke@example.com',
      created_at: '2026-04-01T00:00:00.000Z',
    },
    lifecycle: {
      user_exists: true,
      onboarding_completed: onboardingCompleted,
      has_active_program: hasActiveProgram,
      legacy_kv_migrated_at: '2026-04-01T00:00:00.000Z',
    },
    onboarding: {
      status: onboardingCompleted ? 'completed' : 'not_started',
      completed: onboardingCompleted,
      questionnaireVersion: onboardingCompleted ? 'onboarding-v1' : null,
      answersUpdatedAt: onboardingCompleted ? '2026-04-01T00:00:00.000Z' : null,
      completedAt: onboardingCompleted ? '2026-04-01T00:00:00.000Z' : null,
      answers: onboardingCompleted
        ? {
            questionnaireVersion: 'onboarding-v1',
            goals: ['general_fitness'],
            experienceLevel: 'beginner',
            trainingDaysPerWeek: 3,
            sessionDurationMinutes: 30,
            equipmentAccess: ['bodyweight'],
            focusAreas: ['upper_body', 'lower_body', 'core'],
            limitations: [],
            preferredStyles: ['balanced'],
          }
        : null,
    },
    profile: onboardingCompleted
      ? {
          version: 'profile-v1',
          primary_goal: 'general_fitness',
          experience_level: 'beginner',
          training_days_per_week: 3,
          session_duration_minutes: 30,
          updated_at: '2026-04-01T00:00:00.000Z',
        }
      : null,
    active_program: hasActiveProgram
      ? {
          version_id: 'program_smoke',
          key: 'generated_three_day_general_fitness',
          name: 'General fitness Plan',
          source: 'generated',
          updated_at: '2026-04-01T00:00:00.000Z',
        }
      : null,
  };
}

function buildOnboardingResponse() {
  return {
    status: 'not_started',
    completed: false,
    questionnaireVersion: null,
    answersUpdatedAt: null,
    completedAt: null,
    answers: null,
    profile: null,
  };
}

function buildGeneratedProgramResponse() {
  return {
    ok: true,
    message: 'Program regenerated',
    program: {
      id: 'generated_three_day_general_fitness',
      name: 'General fitness Plan',
      schedule: {
        monday: 'A',
        tuesday: 'rest',
        wednesday: 'B',
        thursday: 'rest',
        friday: 'C',
        saturday: 'rest',
        sunday: 'rest',
      },
      workouts: {
        A: {
          name: 'Workout A',
          exercises: [
            { id: 'pushups', name: 'Push-ups', type: 'reps', max_sets: 3, reps: { min: 8, max: 12 } },
          ],
        },
        B: {
          name: 'Workout B',
          exercises: [
            { id: 'squats', name: 'Bodyweight Squats', type: 'reps', max_sets: 3, reps: { min: 10, max: 14 } },
          ],
        },
        C: {
          name: 'Workout C',
          exercises: [
            { id: 'bird_dog', name: 'Bird Dog', type: 'reps', max_sets: 2, reps: { min: 10, max: 12 } },
          ],
        },
      },
      version_id: 'program_smoke',
      source: 'generated',
    },
    generator: {
      version: 'generator-v1',
      catalog_seed_version: 'catalog-v1',
    },
  };
}

function buildProgramResponse() {
  return {
    ...buildGeneratedProgramResponse().program,
    userSets: {
      pushups: 1,
      squats: 1,
      bird_dog: 1,
    },
    progressionState: {
      pushups: { sets: 1, min: 8, max: 12, last_progression: null },
      squats: { sets: 1, min: 10, max: 14, last_progression: null },
      bird_dog: { sets: 1, min: 10, max: 12, last_progression: null },
    },
  };
}

function buildTodayWorkoutResponse() {
  return {
    date: '2026-04-06',
    name: 'Workout A',
    type: 'A',
    exercises: [
      {
        id: 'pushups',
        name: 'Push-ups',
        type: 'reps',
        max_sets: 3,
        reps: { min: 8, max: 12 },
      },
    ],
  };
}

async function mockApi(
  page: Page,
  handler: (request: { url: URL; method: string; body: unknown }) => Promise<{ status?: number; body?: unknown } | null> | { status?: number; body?: unknown } | null,
) {
  await page.route(`${apiOrigin}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': '*',
        },
      });
      return;
    }

    const bodyText = request.postData();
    const body = bodyText ? JSON.parse(bodyText) : null;
    const response = await handler({ url, method: request.method(), body });

    if (!response) {
      await route.abort();
      return;
    }

    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(response.body ?? {}),
    });
  });
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

test('authenticated user with incomplete onboarding sees onboarding UI', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  const issues = attachClientIssueCollector(page);

  await mockApi(page, ({ url, method }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: false, hasActiveProgram: false }) };
    }

    if (method === 'GET' && url.pathname === '/onboarding') {
      return { body: buildOnboardingResponse() };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#onboarding-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: /build a simple plan that fits you/i })).toBeVisible();
  await expect(page.locator('#app-shell')).toBeHidden();
  await assertNoClientIssues(issues);
});

test('completing onboarding transitions to the main app', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  const issues = attachClientIssueCollector(page);
  let completed = false;

  await mockApi(page, ({ url, method }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: completed, hasActiveProgram: completed }) };
    }

    if (method === 'GET' && url.pathname === '/onboarding') {
      return { body: buildOnboardingResponse() };
    }

    if (method === 'POST' && url.pathname === '/onboarding') {
      return {
        body: {
          ok: true,
          message: 'Onboarding draft saved',
          questionnaire_version: 'onboarding-v1',
          updated_at: '2026-04-06T00:00:00.000Z',
          completed_at: null,
        },
      };
    }

    if (method === 'POST' && url.pathname === '/onboarding/complete') {
      completed = true;
      return { body: buildGeneratedProgramResponse() };
    }

    if (method === 'GET' && url.pathname === '/workout/today') {
      return completed
        ? { body: buildTodayWorkoutResponse() }
        : { status: 409, body: { error: 'Onboarding not completed' } };
    }

    if (method === 'GET' && url.pathname.startsWith('/log/')) {
      return { body: null };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#onboarding-shell')).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /review plan/i }).click();
  await page.getByRole('button', { name: /generate my plan/i }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#today-content')).toBeVisible();
  await expect(page.locator('#today-workout-name')).toHaveText('Workout A');
  await assertNoClientIssues(issues);
});

test('completed onboarding without active program routes the user to program recovery', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  const issues = attachClientIssueCollector(page);
  let regenerated = false;

  await mockApi(page, ({ url, method }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: true, hasActiveProgram: regenerated }) };
    }

    if (method === 'POST' && url.pathname === '/program/regenerate') {
      regenerated = true;
      return { body: buildGeneratedProgramResponse() };
    }

    if (method === 'GET' && url.pathname === '/workout/today') {
      return regenerated
        ? { body: buildTodayWorkoutResponse() }
        : { status: 409, body: { error: 'Active program not found' } };
    }

    if (method === 'GET' && url.pathname === '/program') {
      return regenerated
        ? { body: buildProgramResponse() }
        : { status: 409, body: { error: 'Active program not found' } };
    }

    if (method === 'GET' && url.pathname.startsWith('/log/')) {
      return { body: null };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('No active program yet')).toBeVisible();
  await page.getByRole('button', { name: /open program/i }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /rebuild plan/i }).click();
  await expect(page.locator('#today-workout-name')).toHaveText('Workout A');
  await assertNoClientIssues(issues);
});
