export type StudentStatRow = {
  userId: string;
  name: string;
  xp: number;
  closedTickets: number;
  openTickets: number;
  waitingReview: number;
  gradedCount: number;
  avgGrade: number | null;
  totalXpFromTickets: number;
  labXp: number;
  labBestScore: number;
};

export type ClassroomStatsSummary = {
  studentCount: number;
  avgXp: number;
  closedTickets: number;
  openTickets: number;
  waitingReview: number;
  avgGrade: number | null;
  gradedCount: number;
  students: StudentStatRow[];
};

type AssignmentLike = {
  assigneeId: string;
  status: string;
  evaluation?: { grade: number; xpAwarded: number } | null;
};

type MemberLike = {
  user: {
    id: string;
    name: string | null;
    xp: number;
    role: string;
  };
};

type GameScoreLike = {
  userId: string;
  score: number;
  xpEarned: number;
};

export function computeClassroomStats(
  memberships: MemberLike[],
  assignments: AssignmentLike[],
  gameScores: GameScoreLike[] = [],
): ClassroomStatsSummary {
  const students = memberships.filter((m) => m.user.role === "STUDENT");
  const byUser = new Map<string, StudentStatRow>();

  for (const m of students) {
    byUser.set(m.user.id, {
      userId: m.user.id,
      name: m.user.name || "Studente",
      xp: m.user.xp,
      closedTickets: 0,
      openTickets: 0,
      waitingReview: 0,
      gradedCount: 0,
      avgGrade: null,
      totalXpFromTickets: 0,
      labXp: 0,
      labBestScore: 0,
    });
  }

  const gradeSums = new Map<string, { sum: number; count: number }>();

  for (const a of assignments) {
    const row = byUser.get(a.assigneeId);
    if (!row) continue;
    if (a.status === "RESOLVED") row.closedTickets += 1;
    else if (a.status === "WAITING_REVIEW") row.waitingReview += 1;
    else row.openTickets += 1;

    if (a.evaluation) {
      const g = gradeSums.get(a.assigneeId) || { sum: 0, count: 0 };
      g.sum += a.evaluation.grade;
      g.count += 1;
      gradeSums.set(a.assigneeId, g);
      row.totalXpFromTickets += a.evaluation.xpAwarded;
    }
  }

  for (const [userId, g] of gradeSums) {
    const row = byUser.get(userId);
    if (!row) continue;
    row.gradedCount = g.count;
    row.avgGrade = g.count ? Math.round((g.sum / g.count) * 10) / 10 : null;
  }

  for (const score of gameScores) {
    const row = byUser.get(score.userId);
    if (!row) continue;
    row.labXp += score.xpEarned;
    row.labBestScore = Math.max(row.labBestScore, score.score);
  }

  const list = [...byUser.values()].sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  const closedTickets = list.reduce((s, r) => s + r.closedTickets, 0);
  const openTickets = list.reduce((s, r) => s + r.openTickets, 0);
  const waitingReview = list.reduce((s, r) => s + r.waitingReview, 0);
  const graded = list.filter((r) => r.avgGrade !== null);
  const avgGrade =
    graded.length === 0
      ? null
      : Math.round(
          (graded.reduce((s, r) => s + (r.avgGrade || 0), 0) / graded.length) * 10,
        ) / 10;
  const avgXp =
    list.length === 0 ? 0 : Math.round(list.reduce((s, r) => s + r.xp, 0) / list.length);

  return {
    studentCount: list.length,
    avgXp,
    closedTickets,
    openTickets,
    waitingReview,
    avgGrade,
    gradedCount: graded.reduce((s, r) => s + r.gradedCount, 0),
    students: list,
  };
}
