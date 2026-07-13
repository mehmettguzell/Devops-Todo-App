interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return <p className="empty-state">{message}</p>;
}

export default EmptyState;
