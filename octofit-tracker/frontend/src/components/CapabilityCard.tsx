import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
  children?: ReactNode;
};
export function CapabilityCard({ title, description, loading = false, error = '', empty = false, emptyText = 'No results found.', children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {error ? <p role="alert">Error: {error}</p> : null}
        {!loading && !error && empty ? <p>{emptyText}</p> : null}
        {!loading && !error && !empty ? children : null}
      </div>
    </section>
  );
}
