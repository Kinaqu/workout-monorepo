export interface EmptyStateAction {
  text: string;
  // Picked up by the app shell's [data-action] click delegation.
  type: 'open-tab' | 'regenerate-program' | 'action';
  targetTab?: string;
}

export function EmptyState({
  id,
  title,
  message,
  action,
}: {
  id?: string;
  title: string;
  message: string;
  action?: EmptyStateAction;
}) {
  return (
    <div id={id} className="card empty-state-card">
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-copy">{message}</p>
      {action ? (
        <button type="button" className="secondary-button" data-action={action.type} data-target-tab={action.targetTab}>
          {action.text}
        </button>
      ) : null}
    </div>
  );
}
