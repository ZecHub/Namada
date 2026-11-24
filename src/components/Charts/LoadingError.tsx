type LoadingErrorProps = {
  message: string;
  onRetry?: () => void;
};

export default function LoadingError({ message, onRetry }: LoadingErrorProps) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-3" role="alert">
      <p><i>{message}</i></p>
      {onRetry && (
        <button type="button" className="rounded border px-3 py-1" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
