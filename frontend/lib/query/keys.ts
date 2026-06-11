export const queryKeys = {
  me: ['me'] as const,
  program: ['program'] as const,
  workout: (date: string) => ['workout', date] as const,
  sessions: (filters: { date?: string; limit?: number }) => ['sessions', filters] as const,
  session: (id: string) => ['session', id] as const,
  recommendationDraft: ['recommendation-draft'] as const,
};
