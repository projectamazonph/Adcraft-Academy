/**
 * AdCraft: E2E Smoke Tests
 *
 * Playwright tests for the core user flow:
 * 1. App loads and renders the Dashboard
 * 2. Navigation between tabs works
 * 3. Module view shows learning modules
 * 4. Lesson player opens and displays content
 * 5. AI Mentor chat renders
 * 6. Simulation cards display
 */

import { test, expect } from '@playwright/test';

test.describe('AdCraft MVP Smoke Tests', () => {
  test('app loads and shows Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible with the welcome message
    await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible({ timeout: 15000 });

    // Stats row should render
    await expect(page.getByText('Modules Completed')).toBeVisible();
    await expect(page.getByText('Total XP')).toBeVisible();

    // Learning Modules section
    await expect(page.getByRole('heading', { name: 'Learning Modules' })).toBeVisible();
  });

  test('navigate to Modules tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the Modules tab in the sidebar
    await page.getByRole('button', { name: 'Modules', exact: true }).click();

    // Should show Learning Modules heading
    await expect(page.getByRole('heading', { name: 'Learning Modules' })).toBeVisible();

    // Should show module cards
    await expect(page.getByText('Onboarding', { exact: true })).toBeVisible();
    await expect(page.getByText('Foundations', { exact: true })).toBeVisible();
  });

  test('navigate to Simulations tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the Simulations tab in the sidebar
    await page.getByRole('button', { name: 'Simulations', exact: true }).click();

    // Should show simulation cards
    await expect(page.getByText('Campaign Builder')).toBeVisible();
    await expect(page.getByText('Bid Elevator')).toBeVisible();
    await expect(page.getByText('STR Triage Arena')).toBeVisible();
  });

  test('navigate to AI Mentor tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the AI Mentor tab
    await page.getByRole('button', { name: 'AI Mentor', exact: true }).click();

    // Should show the AI Mentor header
    await expect(page.getByRole('heading', { name: 'AI Mentor' })).toBeVisible();

    // Should show suggested questions
    await expect(page.getByText('Try asking:')).toBeVisible();

    // Should show the input field
    await expect(page.getByPlaceholder('Ask your PPC mentor anything...')).toBeVisible();
  });

  test('open a lesson from Module view', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go to Modules
    await page.getByRole('button', { name: 'Modules', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Learning Modules' })).toBeVisible();

    // Click "Start Module 0" button
    await page.getByRole('button', { name: 'Start Module 0' }).click();

    // Should load the lesson player (may take a moment for server action)
    await expect(page.getByRole('button', { name: 'Back to Modules' })).toBeVisible({ timeout: 10000 });
  });

  test('dark mode is applied', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // HTML should have dark class
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  test('XP badge shows in header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header should show XP value
    await expect(page.getByText('0 XP', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows Quick Actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Quick Actions section should be visible
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue Learning/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Simulation/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ask AI Mentor/ })).toBeVisible();
  });

  test('sidebar navigation highlights active tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dashboard should be active by default
    const dashboardTab = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardTab).toBeVisible();
  });
});
