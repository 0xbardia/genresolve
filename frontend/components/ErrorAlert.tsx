export function ErrorAlert({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="alert alert-error" role="alert" aria-live="assertive">
      <div className="alert-title">{title}</div>
      <div className="whitespace-pre-wrap">{message}</div>
    </div>
  );
}

export function ConfigAlert({ networkName }: { networkName: string }) {
  return (
    <div className="alert alert-warning" role="status">
      <div className="alert-title">Contract address not configured</div>
      <p className="mt-1 opacity-95">
        Set{" "}
        <code className="mono text-[0.8em] text-[var(--gold-soft)]">
          NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET
        </code>{" "}
        and/or{" "}
        <code className="mono text-[0.8em] text-[var(--gold-soft)]">
          NEXT_PUBLIC_CONTRACT_ADDRESS_BRADBURY
        </code>{" "}
        in{" "}
        <code className="mono text-[0.8em] text-[var(--gold-soft)]">
          .env.local
        </code>
        , then restart the dev server.
      </p>
      <p className="mt-2 text-[0.8rem] opacity-80">
        Active network: <strong>{networkName}</strong>
      </p>
    </div>
  );
}

export function InfoAlert({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="alert alert-info" role="status">
      <div className="alert-title">{title}</div>
      <div className="opacity-95">{message}</div>
    </div>
  );
}
