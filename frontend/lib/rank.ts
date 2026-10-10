import { Post, Rule, RankedPost } from "./types";

export function rankPosts(posts: Post[], rule: Rule): RankedPost[] {
  const now = Date.now();
  const stats = posts.map((p) => ({
    p,
    ageHours: (now - p.createdAt) / 3600000,
    totalTips: p.tips.reduce((a, t) => a + t.amount, 0),
    backers: new Set(p.tips.map((t) => t.tipper)).size,
  }));
  const maxTips = Math.max(1, ...stats.map((s) => s.totalTips));
  const maxBackers = Math.max(1, ...stats.map((s) => s.backers));

  return stats
    .map((s) => {
      const recency = 1 / (1 + s.ageHours / 12); // 1 = brand new, fades over time
      const score =
        (rule.wRecency * recency +
          rule.wTips * (s.totalTips / maxTips) +
          rule.wBackers * (s.backers / maxBackers)) / 10000;
      return { ...s.p, totalTips: s.totalTips, backers: s.backers, score };
    })
    .sort((a, b) => b.score - a.score);
}
