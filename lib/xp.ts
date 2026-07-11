import { prisma } from "./prisma";
import type { GameType } from "@prisma/client";

export const XP_REWARDS = {
  COMPLETE: 10,
  PERFECT_BONUS: 20,
  SPEED_BONUS: 5,
  DAILY_FIRST: 15,
  STREAK_DAILY: 10,
} as const;

export function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 500;
  let t = 500;
  for (let l = 5; l <= level; l++) t = Math.round(t * 1.5);
  return t;
}

export function levelForXP(xp: number): number {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level++;
  return level;
}

export const BADGE_DEFS = [
  { name: "First Step", description: "Complete your first game", condition: "first_game" },
  { name: "On Fire", description: "Maintain a 7-day streak", condition: "streak_7" },
  { name: "Unstoppable", description: "Maintain a 30-day streak", condition: "streak_30" },
  { name: "Word Master", description: "Learn 100 words", condition: "words_100" },
  { name: "Perfect", description: "Get 100% on any game", condition: "perfect_score" },
  { name: "Speed Demon", description: "Finish a speed round in under 30s", condition: "speed_30s" },
  { name: "Class Champion", description: "Reach #1 on your class leaderboard", condition: "class_top" },
  { name: "Explorer", description: "Play all 8 game types", condition: "all_types" },
] as const;

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isYesterday(d: Date, now: Date): boolean {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return sameDay(d, y);
}

export async function awardGameResult(params: {
  studentId: string;
  gameId: string;
  score: number; // 0-100
  timeTaken: number; // seconds
  gameType: GameType;
}) {
  const { studentId, gameId, score, timeTaken, gameType } = params;
  const now = new Date();

  const existingXP = await prisma.studentXP.findUnique({ where: { studentId } });
  const playedToday = existingXP?.lastActiveDate ? sameDay(existingXP.lastActiveDate, now) : false;

  let xpEarned = XP_REWARDS.COMPLETE;
  if (score >= 100) xpEarned += XP_REWARDS.PERFECT_BONUS;
  if (timeTaken > 0 && timeTaken < 30) xpEarned += XP_REWARDS.SPEED_BONUS;
  if (!playedToday) xpEarned += XP_REWARDS.DAILY_FIRST;

  // Streak logic
  let streak = existingXP?.streak ?? 0;
  if (!playedToday) {
    if (existingXP?.lastActiveDate && isYesterday(existingXP.lastActiveDate, now)) {
      streak += 1;
      xpEarned += XP_REWARDS.STREAK_DAILY;
    } else {
      streak = 1;
    }
  }

  const prevTotal = existingXP?.totalXP ?? 0;
  const prevLevel = levelForXP(prevTotal);
  const totalXP = prevTotal + xpEarned;
  const level = levelForXP(totalXP);

  const [progress, xpRecord] = await prisma.$transaction([
    prisma.studentProgress.create({ data: { studentId, gameId, score, timeTaken, xpEarned } }),
    prisma.studentXP.upsert({
      where: { studentId },
      create: { studentId, totalXP, level, streak, lastActiveDate: now },
      update: { totalXP, level, streak, lastActiveDate: now },
    }),
  ]);

  const newBadges = await checkBadges({ studentId, score, timeTaken, gameType, streak });

  return {
    progressId: progress.id,
    xpEarned,
    totalXP: xpRecord.totalXP,
    level,
    leveledUp: level > prevLevel,
    nextLevelXP: levelThreshold(level + 1),
    streak,
    newBadges,
  };
}

async function grantBadge(studentId: string, def: (typeof BADGE_DEFS)[number]): Promise<string | null> {
  const badge = await prisma.badge.upsert({
    where: { name: def.name },
    create: { name: def.name, description: def.description, condition: def.condition },
    update: {},
  });
  const existing = await prisma.studentBadge.findUnique({
    where: { studentId_badgeId: { studentId, badgeId: badge.id } },
  });
  if (existing) return null;
  await prisma.studentBadge.create({ data: { studentId, badgeId: badge.id } });
  return badge.name;
}

async function checkBadges(params: {
  studentId: string;
  score: number;
  timeTaken: number;
  gameType: GameType;
  streak: number;
}): Promise<string[]> {
  const { studentId, score, timeTaken, gameType, streak } = params;
  const earned: string[] = [];
  const defs = Object.fromEntries(BADGE_DEFS.map((d) => [d.condition, d]));

  const gamesPlayed = await prisma.studentProgress.count({ where: { studentId } });
  if (gamesPlayed >= 1) {
    const b = await grantBadge(studentId, defs["first_game"]);
    if (b) earned.push(b);
  }
  if (streak >= 7) {
    const b = await grantBadge(studentId, defs["streak_7"]);
    if (b) earned.push(b);
  }
  if (streak >= 30) {
    const b = await grantBadge(studentId, defs["streak_30"]);
    if (b) earned.push(b);
  }
  if (score >= 100) {
    const b = await grantBadge(studentId, defs["perfect_score"]);
    if (b) earned.push(b);
  }
  if (gameType === "SPEED_ROUND" && timeTaken < 30) {
    const b = await grantBadge(studentId, defs["speed_30s"]);
    if (b) earned.push(b);
  }

  // Words learned: distinct vocab items across played games
  const played = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { game: { select: { vocabularySetId: true } } },
    distinct: ["gameId"],
  });
  const setIds = Array.from(new Set(played.map((p) => p.game.vocabularySetId)));
  const wordCount = await prisma.vocabularyItem.count({ where: { setId: { in: setIds } } });
  if (wordCount >= 100) {
    const b = await grantBadge(studentId, defs["words_100"]);
    if (b) earned.push(b);
  }

  // Explorer: all 8 game types played
  const types = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { game: { select: { type: true } } },
    distinct: ["gameId"],
  });
  const uniqueTypes = new Set(types.map((t) => t.game.type));
  if (uniqueTypes.size >= 8) {
    const b = await grantBadge(studentId, defs["all_types"]);
    if (b) earned.push(b);
  }

  return earned;
}

export async function checkClassChampion(studentId: string, classId: string): Promise<string | null> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const members = await prisma.classMember.findMany({ where: { classId }, select: { studentId: true } });
  const scores = await prisma.studentProgress.groupBy({
    by: ["studentId"],
    where: { studentId: { in: members.map((m) => m.studentId) }, completedAt: { gte: weekAgo } },
    _sum: { xpEarned: true },
  });
  scores.sort((a, b) => (b._sum.xpEarned ?? 0) - (a._sum.xpEarned ?? 0));
  if (scores[0]?.studentId === studentId) {
    const def = BADGE_DEFS.find((d) => d.condition === "class_top")!;
    return grantBadge(studentId, def);
  }
  return null;
}
