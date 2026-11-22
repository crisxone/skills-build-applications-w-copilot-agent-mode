import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={!loading && !error && teams.length === 0} emptyText="No teams found.">
      {teams.map((team) => (
        <article className="border-bottom py-2" key={team.name}>
          <strong>{team.name}</strong>{team.mascot ? ` - ${team.mascot}` : ''}
          {team.members?.length ? <div>{team.members.join(', ')}</div> : null}
        </article>
      ))}
    </CapabilityCard>
  );
}
