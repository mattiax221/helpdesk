type TicketLike = {
  secretNotes?: string | null;
  clientHints?: string | null;
  [key: string]: unknown;
};

/** Strip teacher-only fields for non-owners (students / other roles). */
export function redactTicketForViewer<T extends TicketLike>(
  ticket: T,
  canSeeSecrets: boolean,
): T {
  if (canSeeSecrets) return ticket;
  return {
    ...ticket,
    secretNotes: undefined,
    clientHints: undefined,
  };
}

export function redactAssignmentTree<T extends { ticket?: TicketLike | null }>(
  assignment: T,
  canSeeSecrets: boolean,
): T {
  if (!assignment.ticket) return assignment;
  return {
    ...assignment,
    ticket: redactTicketForViewer(assignment.ticket, canSeeSecrets),
  };
}
