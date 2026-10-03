import { describe, it, expect } from 'vitest';
import {
  assignMember,
  createProject,
  fetchProjects,
  fetchProjectsForMember,
  unassignMember,
} from '@/lib/projects/project-service';

const NEW_PROJECT = {
  title: 'Test Outreach Project',
  description: 'Used by the automated tests.',
  track: 'Education',
  supervisor_name: 'Dr. Test',
  supervisor_email: 'supervisor@ngo.org',
  duration_weeks: 4,
  target_hours: 40,
  quota: 3,
};

const MEMBER = { id: 'member-1', name: 'Asha Rao', email: 'Asha@College.edu' };

describe('project assignment', () => {
  it('assigning a volunteer makes the project show up for them (email match ignores case)', async () => {
    const project = await createProject(NEW_PROJECT);
    expect(project.assigned).toHaveLength(0);

    await assignMember(project.id, MEMBER);

    const mine = await fetchProjectsForMember('asha@college.edu');
    expect(mine.map((p) => p.id)).toContain(project.id);
    const stored = (await fetchProjects()).find((p) => p.id === project.id);
    expect(stored?.assigned).toEqual([MEMBER]);
  });

  it('does not add the same volunteer twice, whatever the email casing', async () => {
    const project = await createProject(NEW_PROJECT);

    await assignMember(project.id, MEMBER);
    await assignMember(project.id, { ...MEMBER, email: 'ASHA@college.edu' });

    const stored = (await fetchProjects()).find((p) => p.id === project.id);
    expect(stored?.assigned).toHaveLength(1);
  });

  it('un-assigning removes the project from that volunteer only', async () => {
    const project = await createProject(NEW_PROJECT);
    const other = { id: 'member-2', name: 'Ravi Shah', email: 'ravi@college.edu' };
    await assignMember(project.id, MEMBER);
    await assignMember(project.id, other);

    await unassignMember(project.id, 'asha@COLLEGE.edu');

    expect((await fetchProjectsForMember(MEMBER.email)).map((p) => p.id)).not.toContain(project.id);
    expect((await fetchProjectsForMember(other.email)).map((p) => p.id)).toContain(project.id);
  });

  it('does not show a project to someone who is not assigned to it', async () => {
    const project = await createProject(NEW_PROJECT);
    await assignMember(project.id, MEMBER);

    const stranger = await fetchProjectsForMember('stranger@college.edu');
    expect(stranger.map((p) => p.id)).not.toContain(project.id);
  });
});
