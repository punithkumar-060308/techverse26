export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string[];
  members: { name: string; avatar: string; user_id?: string }[];
  tasks: { total: number; completed: number };
  status: "active" | "planning" | "completed";
  updatedAt: string;
  maxMembers: number;
  memberCount: number;
  isMember?: boolean;
  createdBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: { name: string; avatar: string };
  tags: string[];
}

const avatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Riley",
];

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "StudySync",
    description: "A collaborative note-taking app for study groups with real-time editing and flashcard generation.",
    tech: ["React", "TypeScript", "Supabase"],
    members: [
      { name: "Alex", avatar: avatars[0] },
      { name: "Sam", avatar: avatars[1] },
      { name: "Jordan", avatar: avatars[2] },
    ],
    tasks: { total: 24, completed: 18 },
    status: "active",
    updatedAt: "2 hours ago",
    maxMembers: 5,
    memberCount: 3,
  },
  {
    id: "2",
    name: "CodeReview Bot",
    description: "An AI-powered code review assistant that integrates with GitHub pull requests.",
    tech: ["Python", "FastAPI", "OpenAI"],
    members: [
      { name: "Casey", avatar: avatars[3] },
      { name: "Riley", avatar: avatars[4] },
    ],
    tasks: { total: 16, completed: 7 },
    status: "active",
    updatedAt: "5 hours ago",
    maxMembers: 4,
    memberCount: 2,
  },
  {
    id: "3",
    name: "Campus Events",
    description: "A platform for discovering and managing university campus events and meetups.",
    tech: ["Next.js", "Prisma", "PostgreSQL"],
    members: [
      { name: "Alex", avatar: avatars[0] },
      { name: "Casey", avatar: avatars[3] },
    ],
    tasks: { total: 32, completed: 32 },
    status: "completed",
    updatedAt: "1 day ago",
    maxMembers: 6,
    memberCount: 2,
  },
  {
    id: "4",
    name: "EcoTracker",
    description: "Track personal carbon footprint with gamification elements and community challenges.",
    tech: ["React Native", "Firebase", "D3.js"],
    members: [
      { name: "Sam", avatar: avatars[1] },
      { name: "Jordan", avatar: avatars[2] },
      { name: "Riley", avatar: avatars[4] },
      { name: "Alex", avatar: avatars[0] },
    ],
    tasks: { total: 20, completed: 3 },
    status: "planning",
    updatedAt: "3 days ago",
    maxMembers: 5,
    memberCount: 4,
  },
];

export const mockTasks: Task[] = [
  { id: "t1", title: "Set up project repository", description: "Initialize Git repo with README and .gitignore", status: "done", priority: "high", assignee: { name: "Alex", avatar: avatars[0] }, tags: ["setup"] },
  { id: "t2", title: "Design database schema", description: "Create ER diagram and define table relationships", status: "done", priority: "high", assignee: { name: "Sam", avatar: avatars[1] }, tags: ["database", "design"] },
  { id: "t3", title: "Implement auth flow", description: "Add login, signup, and password reset functionality", status: "in-progress", priority: "high", assignee: { name: "Jordan", avatar: avatars[2] }, tags: ["auth", "backend"] },
  { id: "t4", title: "Build dashboard UI", description: "Create main dashboard layout with sidebar navigation", status: "in-progress", priority: "medium", assignee: { name: "Alex", avatar: avatars[0] }, tags: ["frontend", "ui"] },
  { id: "t5", title: "API endpoints for notes", description: "CRUD endpoints for note management", status: "todo", priority: "medium", assignee: { name: "Sam", avatar: avatars[1] }, tags: ["api", "backend"] },
  { id: "t6", title: "Real-time collaboration", description: "Implement WebSocket-based real-time editing", status: "todo", priority: "high", tags: ["feature", "websocket"] },
  { id: "t7", title: "Add search functionality", description: "Full-text search across notes and projects", status: "todo", priority: "low", tags: ["feature"] },
  { id: "t8", title: "Write unit tests", description: "Add tests for auth and note services", status: "review", priority: "medium", assignee: { name: "Jordan", avatar: avatars[2] }, tags: ["testing"] },
  { id: "t9", title: "Mobile responsive design", description: "Ensure all pages work on mobile devices", status: "review", priority: "medium", assignee: { name: "Alex", avatar: avatars[0] }, tags: ["frontend", "responsive"] },
];
