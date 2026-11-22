import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={!loading && !error && activities.length === 0} emptyText="No activities found.">
      {activities.map((activity, index) => (
        <article className="border-bottom py-2" key={`${activity.type}-${index}`}>
          <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
        </article>
      ))}
    </CapabilityCard>
  );
}
