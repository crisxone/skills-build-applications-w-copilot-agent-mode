import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isObject(input)) throw httpError(400, 'Invalid activity');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw httpError(400, 'Invalid user ID');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw httpError(400, 'Invalid team ID');
  if (typeof type !== 'string' || type.trim() === '') throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw httpError(400, 'Minutes must be positive');

  const [user, team] = await Promise.all([User.findById(userId).lean(), Team.findById(teamId).lean()]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isObject(input)) throw httpError(400, 'Invalid team');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw httpError(400, 'Team name is required');
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!mascot) throw httpError(400, 'Team mascot is required');
  if (input.members !== undefined && !Array.isArray(input.members)) throw httpError(400, 'Team members must be an array');
  const members = input.members === undefined
    ? []
    : input.members as unknown[];
  if (members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw httpError(400, 'Invalid team member ID');
  }
  if (members.length > 0) {
    const memberIds = members as string[];
    const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (existingMembers.length !== new Set(memberIds).size) throw httpError(404, 'Team member not found');
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  if (totals.length === 0) return [];
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((entry) => ({
      teamName: names.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = typeof recent?.type === 'string' ? recent.type.trim().toLowerCase() : '';
  const focusFromActivity: Record<string, string> = {
    run: 'endurance',
    walk: 'mobility',
    cycle: 'endurance',
    strength: 'strength',
  };
  const focus = goal || focusFromActivity[activityType] || activityType;

  let workout = await Workout.findOne({ focus }).lean();
  if (!workout && activityType) {
    const fallbackFocus = focusFromActivity[activityType];
    workout = fallbackFocus ? await Workout.findOne({ focus: fallbackFocus }).lean() : null;
  }
  if (!workout) return [];

  const reason = goal
    ? `Selected for your ${goal} fitness goal.`
    : `Selected from your recent ${activityType || 'activity'} activity.`;
  return [{ ...workout, reason }];
}

export { User };
