import 'server-only';
import { LinearClient } from '@linear/sdk';

let _client: LinearClient | null = null;

export function linear() {
  if (!_client) {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) throw new Error('LINEAR_API_KEY is not set');
    _client = new LinearClient({ apiKey });
  }
  return _client;
}

export async function getIssue(identifier: string) {
  return linear().issue(identifier);
}

export async function createIssue(args: {
  title: string;
  description?: string;
  labelNames?: string[];
}) {
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) throw new Error('LINEAR_TEAM_ID is not set');

  const labels = await linear().issueLabels();
  const labelIds =
    args.labelNames
      ?.map((n) => labels.nodes.find((l) => l.name === n)?.id)
      .filter((id): id is string => Boolean(id)) ?? [];

  return linear().createIssue({
    teamId,
    title: args.title,
    description: args.description,
    labelIds,
  });
}
