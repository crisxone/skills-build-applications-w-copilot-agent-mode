import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((data) => setSuggestions(data.suggestions))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={!loading && !error && suggestions.length === 0} emptyText="No workout suggestions found.">
      {suggestions.map((workout) => (
        <article className="border-bottom py-2" key={workout.title}>
          <strong>{workout.title}</strong>
          {workout.reason ? <p className="mb-0">{workout.reason}</p> : null}
        </article>
      ))}
    </CapabilityCard>
  );
}
