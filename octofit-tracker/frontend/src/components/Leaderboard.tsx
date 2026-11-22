import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={!loading && !error && entries.length === 0} emptyText="No leaderboard rankings found.">
      <ol className="mb-0">
        {entries.map((entry) => (
          <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
