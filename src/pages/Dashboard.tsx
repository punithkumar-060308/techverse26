import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectCard from "@/components/ProjectCard";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Project } from "@/lib/mock-data";

interface DbProject {
  id: string;
  name: string;
  description: string;
  tech: string[];
  status: string;
  created_at: string;
  created_by: string;
  max_members: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Project["status"]>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTech, setNewTech] = useState("");
  const [newStatus, setNewStatus] = useState<Project["status"]>("planning");
  const [newMaxMembers, setNewMaxMembers] = useState("5");
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    // Fetch projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!projectsData) return;

    // Fetch all member counts and membership info
    const { data: membersData } = await supabase
      .from("project_members")
      .select("project_id, user_id");

    const memberCountMap: Record<string, number> = {};
    const userMembershipSet = new Set<string>();

    (membersData || []).forEach((m: { project_id: string; user_id: string }) => {
      memberCountMap[m.project_id] = (memberCountMap[m.project_id] || 0) + 1;
      if (user && m.user_id === user.id) {
        userMembershipSet.add(m.project_id);
      }
    });

    // Fetch member profiles for display
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url");

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    (profilesData || []).forEach((p) => {
      profileMap[p.user_id] = p;
    });

    const displayProjects: Project[] = projectsData.map((p: DbProject) => {
      const projectMembers = (membersData || [])
        .filter((m: { project_id: string; user_id: string }) => m.project_id === p.id)
        .map((m: { project_id: string; user_id: string }) => {
          const profile = profileMap[m.user_id];
          return {
            name: profile?.display_name || "User",
            avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`,
            user_id: m.user_id,
          };
        });

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        tech: p.tech || [],
        members: projectMembers,
        tasks: { total: 0, completed: 0 },
        status: p.status as Project["status"],
        updatedAt: new Date(p.created_at).toLocaleDateString(),
        maxMembers: p.max_members,
        memberCount: memberCountMap[p.id] || 0,
        isMember: userMembershipSet.has(p.id),
        createdBy: p.created_by,
      };
    });

    setProjects(displayProjects);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("projects").insert({
      name: newName.trim(),
      description: newDesc.trim(),
      tech: newTech.split(",").map((t) => t.trim()).filter(Boolean),
      status: newStatus,
      created_by: user.id,
      max_members: parseInt(newMaxMembers) || 5,
    });
    if (error) {
      toast.error("Failed to create project");
    } else {
      toast.success("Project created!");
      setNewName("");
      setNewDesc("");
      setNewTech("");
      setNewStatus("planning");
      setNewMaxMembers("5");
      setDialogOpen(false);
      fetchProjects();
    }
    setCreating(false);
  };

  const handleJoin = async (projectId: string) => {
    if (!user) return;
    const project = projects.find((p) => p.id === projectId);
    if (project && project.memberCount >= project.maxMembers) {
      toast.error("Project is full");
      return;
    }
    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: user.id,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already a member" : "Failed to join");
    } else {
      toast.success("Joined project!");
      fetchProjects();
    }
  };

  const handleLeave = async (projectId: string) => {
    if (!user) return;
    const project = projects.find((p) => p.id === projectId);
    if (project?.createdBy === user.id) {
      toast.error("Project creator cannot leave");
      return;
    }
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to leave project");
    } else {
      toast.success("Left project");
      fetchProjects();
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and collaborate on your team projects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-mono">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My Awesome Project"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What's this project about?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tech">Technologies (comma-separated)</Label>
                  <Input
                    id="tech"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="React, TypeScript, Node.js"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="1"
                    max="50"
                    value={newMaxMembers}
                    onChange={(e) => setNewMaxMembers(e.target.value)}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Project["status"])}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                >
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "planning", "completed"] as const).map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                className="rounded-lg capitalize font-mono text-xs"
                onClick={() => setFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-mono">No projects found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
