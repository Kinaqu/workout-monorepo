import { expect, request as playwrightRequest, test, type Page } from '@playwright/test';

const HOSTED_DEFAULT_API_BASE_URL = 'https://workout-api.dimer133745.workers.dev';
const expectClerkKey = process.env.EXPECT_CLERK_PUBLISHABLE_KEY === 'true';
const configuredBaseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const isDeploymentSmoke = Boolean(process.env.BASE_URL);
const isVercelPreviewSmoke = isDeploymentSmoke && isVercelHostedOrigin(new URL(configuredBaseUrl).origin);
const bypassHeaders = bypassSecret
  ? {
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : undefined;
const apiOrigin = resolveSmokeApiOrigin();

function normalizeBaseUrl(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function isVercelHostedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isSuspiciousHostedBaseUrl(baseUrl: string, currentOrigin: string): boolean {
  return Boolean(baseUrl && currentOrigin && baseUrl === currentOrigin && isVercelHostedOrigin(currentOrigin));
}

function resolveSmokeApiOrigin(): string {
  const currentOrigin = new URL(configuredBaseUrl).origin;
  const runtimeConfiguredBaseUrl = normalizeBaseUrl(
    process.env.VITE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );

  if (runtimeConfiguredBaseUrl && !isSuspiciousHostedBaseUrl(runtimeConfiguredBaseUrl, currentOrigin)) {
    return runtimeConfiguredBaseUrl;
  }

  if (runtimeConfiguredBaseUrl) {
    return HOSTED_DEFAULT_API_BASE_URL;
  }

  if (!isDeploymentSmoke) {
    return currentOrigin;
  }

  return isVercelHostedOrigin(currentOrigin) ? HOSTED_DEFAULT_API_BASE_URL : currentOrigin;
}

function isIgnorableClerkPreviewIssue(message: string) {
  if (!isDeploymentSmoke || !expectClerkKey) {
    return false;
  }

  return (
    message.includes('clerk.accounts.dev') ||
    message.includes('Failed to load Clerk JS') ||
    message.includes('failed_to_load_clerk_js') ||
    message.includes('Redirect is not allowed for a preflight request') ||
    message.includes('Failed to load resource: net::ERR_FAILED')
  );
}

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
    if (isIgnorableClerkPreviewIssue(error.message)) {
      return;
    }

    pageErrors.push(error.message);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      const text = message.text();
      if (isIgnorableClerkPreviewIssue(text)) {
        return;
      }

      consoleErrors.push(text);
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

async function installApiRuntimeConfig(page: Page) {
  await page.addInitScript(origin => {
    window.__APP_CONFIG__ = {
      ...(window.__APP_CONFIG__ || {}),
      apiBaseUrl: origin,
    };
  }, apiOrigin);
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

function buildCompletedOnboardingResponse() {
  return {
    status: 'completed',
    completed: true,
    questionnaireVersion: 'onboarding-v1',
    answersUpdatedAt: '2026-04-01T00:00:00.000Z',
    completedAt: '2026-04-01T00:00:00.000Z',
    answers: {
      questionnaireVersion: 'onboarding-v1',
      goals: ['general_fitness'],
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
      sessionDurationMinutes: 30,
      equipmentAccess: ['bodyweight'],
      focusAreas: ['upper_body', 'lower_body', 'core'],
      limitations: [],
      preferredStyles: ['balanced'],
    },
    profile: {
      version: 'profile-v1',
      primary_goal: 'general_fitness',
      training_days_per_week: 3,
      session_duration_minutes: 30,
      updated_at: '2026-04-01T00:00:00.000Z',
    },
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
    generator_metadata: {
      version: 'generator-v1',
      catalog_seed_version: 'catalog-v1',
    },
    generated_program_metadata: {
      generation_reason: 'regenerate',
      profile_version: 'profile-v1',
      created_at: '2026-04-10T09:00:00.000Z',
      input_summary: {
        primaryGoal: 'general_fitness',
        trainingDaysPerWeek: 3,
        sessionDurationMinutes: 45,
      },
    },
    progression_events: [
      {
        id: 'pe_smoke_1',
        exercise_id: 'exercise_pushups',
        catalog_exercise_id: 'catalog_pushups',
        exercise_key: 'pushups',
        exercise_name: 'Push-ups',
        direction: 'up',
        reason: 'Exceeded the top rep target',
        before: { sets: 1, min: 8, max: 12 },
        after: { sets: 2, min: 10, max: 14 },
        created_at: '2026-04-16T12:00:00.000Z',
      },
    ],
    program_runtime_state: {
      last_session_logged_at: '2026-04-15T08:30:00.000Z',
      last_progression_run_at: '2026-04-16T12:00:00.000Z',
      created_at: '2026-04-10T09:00:00.000Z',
      updated_at: '2026-04-16T12:00:00.000Z',
    },
    active_version: {
      status: 'active',
      program_family_id: 'program_family_smoke',
      version_number: 3,
      previous_version_id: 'program_smoke_prev',
      created_at: '2026-04-10T09:00:00.000Z',
      updated_at: '2026-04-16T12:00:00.000Z',
      source: 'generated',
    },
    current_version_changes: {
      summary: '2 schedule days were remapped (Monday, Thursday).',
      highlights: [
        '2 schedule days were remapped (Monday, Thursday).',
        '1 session was added (Workout C).',
        '2 exercise targets were adjusted.',
      ],
      stats: {
        schedule_changes: 2,
        workouts_added: 1,
        workouts_removed: 0,
        exercises_added: 1,
        exercises_removed: 0,
        target_changes: 2,
        set_cap_changes: 1,
        renamed: false,
      },
    },
  };
}

function buildTodayWorkoutResponse(date = '2026-04-06') {
  return {
    date,
    name: 'Workout A',
    type: 'A',
    exercises: [
      {
        id: 'pushups',
        name: 'Push-ups',
        type: 'reps',
        sets: 2,
        max_sets: 3,
        reps: { min: 8, max: 12 },
      },
    ],
  };
}

function buildSessionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session_smoke_1',
    sessionDate: '2026-04-06',
    workoutType: 'A',
    workoutName: 'Workout A',
    note: 'Felt solid and controlled.',
    source: 'text',
    rawText: 'Push-ups 12 11',
    unmatched: ['Burpees 8 8'],
    createdAt: '2026-04-06T07:30:00.000Z',
    updatedAt: '2026-04-06T07:35:00.000Z',
    exercises: [
      {
        id: 'se_smoke_1',
        programExerciseId: 'exercise_pushups',
        catalogExerciseId: 'catalog_pushups',
        exerciseKey: 'pushups',
        exerciseName: 'Push-ups',
        exerciseType: 'reps',
        matched: true,
        sortOrder: 0,
        sets: [12, 11],
      },
      {
        id: 'se_smoke_2',
        programExerciseId: null,
        catalogExerciseId: null,
        exerciseKey: null,
        exerciseName: 'Burpees',
        exerciseType: 'reps',
        matched: false,
        sortOrder: 1,
        sets: [8, 8],
      },
    ],
    ...overrides,
  };
}

async function mockApi(
  page: Page,
  handler: (request: { url: URL; method: string; body: unknown }) => Promise<{ status?: number; body?: unknown } | null> | { status?: number; body?: unknown } | null,
) {
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const isApiRequest =
      url.origin === apiOrigin &&
      (
        url.pathname === '/me' ||
        url.pathname === '/onboarding' ||
        url.pathname === '/onboarding/complete' ||
        url.pathname === '/workout/today' ||
        url.pathname === '/log' ||
        url.pathname.startsWith('/log/') ||
        url.pathname === '/sessions' ||
        url.pathname.startsWith('/sessions/') ||
        url.pathname === '/program' ||
        url.pathname === '/program/reset' ||
        url.pathname === '/program/regenerate' ||
        url.pathname === '/progression/run'
      );

    if (!isApiRequest) {
      await route.continue();
      return;
    }

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
      body: JSON.stringify(response.body === undefined ? {} : response.body),
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

  const missingKeyNotice = page.getByText('Clerk key is missing');
  if (expectClerkKey) {
    await expect(missingKeyNotice).toHaveCount(0);
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await assertNoClientIssues(issues);
}

test('deployment smoke resolves API origin away from the frontend preview host', async () => {
  test.skip(!isVercelPreviewSmoke, 'Only relevant for Vercel preview environments.');

  const previewOrigin = new URL(configuredBaseUrl).origin;
  expect(apiOrigin).not.toBe(previewOrigin);
  expect(apiOrigin).toBe(HOSTED_DEFAULT_API_BASE_URL);
});

test('serves required public assets', async ({ request }) => {
  const assetPaths = [
    '/manifest.json',
    '/sw.js',
    '/favicon.svg',
    '/logo.svg',
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
  await installApiRuntimeConfig(page);
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
  await expect(page.locator('#onboarding-title')).toHaveText(/set up your plan/i);
  await expect(page.locator('[data-onboarding-step-item]')).toHaveCount(3);
  await expect(page.locator('#app-shell')).toBeHidden();
  await assertNoClientIssues(issues);
});

test('completing onboarding transitions to the main app', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  await installApiRuntimeConfig(page);
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

    if (method === 'GET' && url.pathname === '/program') {
      return completed
        ? { body: buildProgramResponse() }
        : { status: 409, body: { error: 'Onboarding not completed' } };
    }

    if (method === 'GET' && url.pathname === '/sessions') {
      return { body: { sessions: [], count: 0 } };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#onboarding-shell')).toBeVisible();
  await expect(page.locator('[data-onboarding-step-panel="0"]')).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.locator('[data-onboarding-step-panel="1"]')).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.locator('[data-onboarding-step-panel="2"]')).toBeVisible();
  await expect(page.locator('#onboarding-review')).toBeVisible();
  await page.getByRole('button', { name: /build plan/i }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#today-content')).toBeVisible();
  await expect(page.locator('#today-workout-name')).toHaveText('Workout A');
  await expect(page.locator('#today-guidance-title')).toHaveText(/log each set/i);
  await expect(page.locator('.exercise-chip')).toContainText(['8-12 reps', '2/3 sets']);
  await expect(page.locator('.set-row')).toHaveCount(2);
  await assertNoClientIssues(issues);
});

test('completed onboarding without active program routes the user to program recovery', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  await installApiRuntimeConfig(page);
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

    if (method === 'GET' && url.pathname === '/sessions') {
      return { body: { sessions: [], count: 0 } };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#today-empty-state')).toContainText(/no plan yet/i);
  await page.getByRole('button', { name: /open plan/i }).click();
  await expect(page.locator('#program-empty-state')).toContainText(/no plan available/i);
  await page.getByRole('button', { name: /build plan/i }).click();
  await expect(page.locator('#confirm-dialog')).toBeVisible();
  await page.locator('#confirm-dialog').getByRole('button', { name: /build new plan/i }).click();
  await expect(page.locator('#program-main')).toBeVisible();
  await expect(page.locator('#program-schedule')).toContainText(/day a|rest/i);
  await expect(page.locator('#program-workouts')).toContainText(/workout a/i);
  await assertNoClientIssues(issues);
});

test('completed users do not autosave onboarding drafts when a stale flow tries to re-enter onboarding', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  await installApiRuntimeConfig(page);
  const issues = attachClientIssueCollector(page);
  let onboardingDraftPosts = 0;
  let recovered = false;

  await mockApi(page, ({ url, method }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: true, hasActiveProgram: true }) };
    }

    if (method === 'GET' && url.pathname === '/workout/today') {
      return recovered
        ? { body: buildTodayWorkoutResponse() }
        : { status: 409, body: { error: 'Onboarding not completed' } };
    }

    if (method === 'GET' && url.pathname === '/onboarding') {
      recovered = true;
      return { body: buildCompletedOnboardingResponse() };
    }

    if (method === 'POST' && url.pathname === '/onboarding') {
      onboardingDraftPosts += 1;
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

    if (method === 'GET' && url.pathname === '/program') {
      return { body: buildProgramResponse() };
    }

    if (method === 'GET' && url.pathname === '/sessions') {
      return { body: { sessions: [], count: 0 } };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#onboarding-shell')).toBeHidden();
  await expect(page.locator('#today-content')).toBeVisible();
  await expect(page.locator('#today-workout-name')).toHaveText('Workout A');
  expect(onboardingDraftPosts).toBe(0);
  expect.soft(issues.pageErrors, 'page errors').toEqual([]);
  expect.soft(issues.sameOriginFailures, 'same-origin failed requests').toEqual([]);
  expect.soft(
    issues.consoleErrors.filter(message => !message.includes('status of 409 (Conflict)')),
    'unexpected console errors'
  ).toEqual([]);
});

test('history screen renders sessions list and detail diagnostics from /sessions', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  await installApiRuntimeConfig(page);
  const issues = attachClientIssueCollector(page);
  const sessionOne = buildSessionRecord();
  const sessionTwo = buildSessionRecord({
    id: 'session_smoke_2',
    workoutType: 'B',
    workoutName: 'Workout B',
    source: 'json',
    rawText: null,
    unmatched: [],
    createdAt: '2026-04-06T11:10:00.000Z',
    updatedAt: '2026-04-06T11:10:00.000Z',
    exercises: [
      {
        id: 'se_smoke_3',
        programExerciseId: 'exercise_squats',
        catalogExerciseId: 'catalog_squats',
        exerciseKey: 'squats',
        exerciseName: 'Bodyweight Squats',
        exerciseType: 'reps',
        matched: true,
        sortOrder: 0,
        sets: [15, 15, 14],
      },
    ],
  });

  await mockApi(page, ({ url, method }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: true, hasActiveProgram: true }) };
    }

    if (method === 'GET' && url.pathname === '/workout/today') {
      return { body: buildTodayWorkoutResponse() };
    }

    if (method === 'GET' && url.pathname === '/program') {
      return { body: buildProgramResponse() };
    }

    if (method === 'GET' && url.pathname === '/sessions') {
      return { body: { sessions: [sessionTwo, sessionOne], count: 2 } };
    }

    if (method === 'GET' && url.pathname === '/sessions/session_smoke_2') {
      return { body: sessionTwo };
    }

    if (method === 'GET' && url.pathname === '/sessions/session_smoke_1') {
      return { body: sessionOne };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav-item[data-tab="history"]').click();

  await expect(page.locator('#history-session-list .history-session-item')).toHaveCount(2);
  await expect(page.locator('#history-session-summary')).toContainText(/2 sessions/i);
  await expect(page.locator('#history-detail')).toContainText(/source: structured/i);
  await expect(page.locator('#history-detail')).toContainText(/matched exercises/i);
  await expect(page.locator('#history-detail')).toContainText(/raw import/i);

  await page.locator('#history-session-list .history-session-item').nth(1).click();
  await expect(page.locator('#history-detail')).toContainText(/source: text import/i);
  await expect(page.locator('#history-detail')).toContainText(/unmatched import lines/i);
  await expect(page.locator('#history-detail')).toContainText(/burpees 8 8/i);
  await assertNoClientIssues(issues);
});

test('today date picker, progression refresh, and manual program controls work together', async ({ page }) => {
  await enableVercelProtectionBypass(page);
  await installLegacySession(page);
  await installApiRuntimeConfig(page);
  const issues = attachClientIssueCollector(page);
  let savedProgramBody: Record<string, unknown> | null = null;
  let resetCalled = false;
  let progressionRuns = 0;

  await mockApi(page, ({ url, method, body }) => {
    if (method === 'GET' && url.pathname === '/me') {
      return { body: buildMeResponse({ onboardingCompleted: true, hasActiveProgram: true }) };
    }

    if (method === 'GET' && url.pathname === '/workout/today') {
      return { body: buildTodayWorkoutResponse(url.searchParams.get('date') || '2026-04-06') };
    }

    if (method === 'GET' && url.pathname === '/program') {
      const response = buildProgramResponse();
      if (progressionRuns > 0) {
        response.progressionState.pushups.last_progression = '2026-04-16';
      }
      return { body: response };
    }

    if (method === 'GET' && url.pathname === '/sessions') {
      return { body: { sessions: [], count: 0 } };
    }

    if (method === 'POST' && url.pathname === '/progression/run') {
      progressionRuns += 1;
      return {
        body: {
          ok: true,
          progression_date: '2026-04-16',
          result: {
            changed: [
              {
                id: 'pushups',
                name: 'Push-ups',
                direction: 'up',
                reason: 'Exceeded the top rep target',
                before: { sets: 1, min: 8, max: 12 },
                after: { sets: 2, min: 10, max: 14 },
              },
            ],
            skipped: [],
          },
        },
      };
    }

    if (method === 'POST' && url.pathname === '/program') {
      savedProgramBody = body as Record<string, unknown>;
      return {
        body: {
          ok: true,
          message: 'Program saved',
          program: {
            ...(body as Record<string, unknown>),
            version_id: 'program_saved_smoke',
          },
        },
      };
    }

    if (method === 'POST' && url.pathname === '/program/reset') {
      resetCalled = true;
      return {
        body: {
          ok: true,
          message: 'Program reset to default',
          program: {
            ...buildProgramResponse(),
            version_id: 'program_reset_smoke',
          },
        },
      };
    }

    return { status: 404, body: { error: 'Not found' } };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#today-date')).toHaveValue(/\d{4}-\d{2}-\d{2}/);

  await page.locator('#today-date').fill('2026-04-19');
  await page.locator('#today-date').dispatchEvent('change');
  await expect(page.locator('#today-workout-date')).toContainText(/apr 19/i);

  await page.getByRole('button', { name: /refresh progression/i }).click();
  await expect(page.locator('#today-progression-feedback')).toContainText(/progression refreshed/i);
  await expect(page.locator('#today-progression-feedback')).toContainText(/push-ups/i);
  await expect(page.locator('#today-progression-last-run')).toContainText(/apr 16/i);

  await page.locator('.nav-item[data-tab="program"]').click();
  await expect(page.locator('#program-summary-copy')).toContainText(/general fitness plan/i);
  await expect(page.locator('#program-generation-summary')).toContainText(/generated from the saved onboarding profile/i);
  await expect(page.locator('#program-runtime-summary')).toContainText(/last refresh ran on/i);
  await expect(page.locator('#program-version-meta')).toContainText(/active/i);
  await expect(page.locator('#program-changes-list')).toContainText(/schedule days were remapped/i);
  await expect(page.locator('#program-timeline-list')).toContainText(/push-ups/i);

  await page.getByRole('button', { name: /edit plan/i }).click();
  await expect(page.locator('#program-editor')).toBeVisible();
  await page.locator('#program-editor-name').fill('Custom strength block');
  await page.locator('#program-save-button').click();
  await expect.poll(() => savedProgramBody?.name).toBe('Custom strength block');

  await page.getByRole('button', { name: /reset to default/i }).click();
  await expect(page.locator('#confirm-dialog')).toBeVisible();
  await page.locator('#confirm-dialog-input').fill('test-reset-token');
  await page.locator('#confirm-dialog').getByRole('button', { name: /reset program/i }).click();
  await expect.poll(() => resetCalled).toBeTruthy();
  await assertNoClientIssues(issues);
});
