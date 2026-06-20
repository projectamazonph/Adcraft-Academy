'use server';

/**
 * AdCraft: Lesson Content Server Action
 *
 * Reads MDX lesson files from the content directory and returns
 * the parsed frontmatter + markdown body for the LessonPlayer.
 *
 * IMPORTANT: This file ONLY exports async functions.
 * Types are in ./types.ts to avoid "Invalid Server Actions request" errors
 * in Next.js 16 (which forbids non-function exports from 'use server' files).
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/logger';
import type { LessonMeta, LessonContent } from './types';

const CONTENT_DIR = join(process.cwd(), 'content/modules');

/**
 * Read a single lesson's content by module number and lesson number.
 * File naming convention: {moduleNumber}-{slug}/{moduleNumber}.{lessonOrder}-{title}.mdx
 */
export async function getLessonContent(
  moduleNumber: number,
  lessonOrder: number
): Promise<{ success: true; data: LessonContent } | { success: false; error: string }> {
  try {
    // Find the module directory
    const moduleDirName = await findModuleDir(moduleNumber);
    if (!moduleDirName) {
      return { success: false, error: `Module ${moduleNumber} not found` };
    }

    // Find the lesson file matching the module+order number
    // File naming convention: {moduleNumber}.{lessonOrder}-{title}.mdx
    const lessonFileName = await findLessonFile(moduleDirName, moduleNumber, lessonOrder);
    if (!lessonFileName) {
      return { success: false, error: `Lesson ${lessonOrder} not found in module ${moduleNumber}` };
    }

    const filePath = join(CONTENT_DIR, moduleDirName, lessonFileName);
    const raw = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { success: false, error: 'Invalid MDX format: missing frontmatter' };
    }

    const [, frontmatterStr, body] = frontmatterMatch;
    const meta = parseFrontmatter(frontmatterStr);

    return {
      success: true,
      data: { meta, body: body.trim() },
    };
  } catch (error) {
    logger.error('getLessonContent failed', { error: String(error) });
    return { success: false, error: 'Failed to read lesson content' };
  }
}

/**
 * List all lessons for a module, returning their frontmatter + order.
 */
export async function listModuleLessons(
  moduleNumber: number
): Promise<{ success: true; data: LessonMeta[] } | { success: false; error: string }> {
  try {
    const moduleDirName = await findModuleDir(moduleNumber);
    if (!moduleDirName) {
      return { success: false, error: `Module ${moduleNumber} not found` };
    }

    const dirPath = join(CONTENT_DIR, moduleDirName);
    const files = await readdir(dirPath);

    const lessons: LessonMeta[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const raw = await readFile(join(dirPath, file), 'utf-8');
      const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        lessons.push(parseFrontmatter(frontmatterMatch[1]));
      }
    }

    // Sort by lesson number
    lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

    return { success: true, data: lessons };
  } catch (error) {
    logger.error('listModuleLessons failed', { error: String(error) });
    return { success: false, error: 'Failed to list lessons' };
  }
}

// --- Helpers (NOT exported — only used internally) ---

async function findModuleDir(moduleNumber: number): Promise<string | null> {
  const entries = await readdir(CONTENT_DIR);
  const prefix = `${moduleNumber}-`;
  return entries.find((e) => e.startsWith(prefix)) || null;
}

async function findLessonFile(moduleDirName: string, moduleNumber: number, lessonOrder: number): Promise<string | null> {
  const dirPath = join(CONTENT_DIR, moduleDirName);
  const files = await readdir(dirPath);
  // File naming: {moduleNumber}.{lessonOrder}-{title}.mdx (e.g. "0.1-welcome.mdx")
  const prefix = `${moduleNumber}.${lessonOrder}`;
  return files.find((f) => f.startsWith(prefix) && f.endsWith('.mdx')) || null;
}

function parseFrontmatter(raw: string): LessonMeta {
  const lines = raw.split('\n');
  const meta: Record<string, any> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (match) {
      const key = match[1];
      let value: any = match[2];
      // Parse numbers
      if (/^\d+$/.test(value)) value = parseInt(value, 10);
      if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
      meta[key] = value;
    }
  }

  return {
    title: meta.title || 'Untitled',
    slug: meta.slug || '',
    moduleNumber: meta.moduleNumber ?? 0,
    lessonNumber: meta.lessonNumber ?? 1,
    type: meta.type || 'reading',
    estimatedMinutes: meta.estimatedMinutes ?? 10,
    xpReward: meta.xpReward ?? 50,
  };
}
