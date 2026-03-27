import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, GitBranch, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectTaskBoard from "@/components/ProjectTaskBoard";
import ProjectTeamChat from "@/components/ProjectTeamChat";
import { type Project } from "@/lib/mock-data";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    if (!id) return;
    const { data: p } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!p) {
      setLoading(false);
      return;
    }

    const { data: membersData } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", id);

    const memberUserIds = (membersData || []).map((m: { user_id: string }) => m.user_id);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url");

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    (profilesData || []).forEach((pr) => {
      profileMap[pr.user_id] = pr;
    });

    const members = memberUserIds.map((uid: string) => {
      const profile = profileMap[uid];
      return {
        name: profile?.display_name || "User",
        avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        user_id: uid,
      };
    });

    setProject({
      id: p.id,
      name: p.name,
      description: p.description,
      tech: p.tech || [],
      members,
      tasks: { total: 0, completed: 0 },
      status: p.status as Project["status"],
      updatedAt: new Date(p.created_at).toLocaleDateString(),
      maxMembers: (p as any).max_members || 5,
      memberCount: memberUserIds.length,
      isMember: user ? memberUserIds.includes(user.id) : false,
      createdBy: p.created_by,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [id, user]);

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", project.id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success("Status updated!");
      fetchProject();
    }
  };

  const handleJoin = async () => {
    if (!user || !project) return;
    if (project.memberCount >= project.maxMembers) {
      toast.error("Project is full");
      return;
    }
    const { error } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
    });
    if (error) toast.error("Failed to join");
    else {
      toast.success("Joined project!");
      fetchProject();
    }
  };

  const handleLeave = async () => {
    if (!user || !project) return;
    if (project.createdBy === user.id) {
      toast.error("Project creator cannot leave");
      return;
    }
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", user.id);
    if (error) toast.error("Failed to leave");
    else {
      toast.success("Left project");
      fetchProject();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground font-mono">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground font-mono">Project not found</p>
        </div>
      </AppLayout>
    );
  }

  const isCreator = user?.id === project.createdBy;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 -ml-2 mb-3 text-muted-foreground"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Projects
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className="capitalize">{project.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex gap-2">
            {project.isMember ? (
              <Button variant="outline" size="sm" className="gap-1 rounded-lg" onClick={handleLeave}>
                <LogOut className="w-4 h-4" /> Leave
              </Button>
            ) : (
              project.memberCount < project.maxMembers && (
                <Button size="sm" className="gap-1 rounded-lg" onClick={handleJoin}>
                  <LogIn className="w-4 h-4" /> Join Project
                </Button>
              )
            )}
          </div>
        </div>

        {/* Project meta */}
        <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {project.members.map((m) => (
                <Avatar key={m.user_id || m.name} className="w-7 h-7 border-2 border-background">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback className="text-xs">{m.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {project.memberCount}/{project.maxMembers} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">main</span>
          </div>
          <div className="flex gap-1.5">
            {project.tech.map((t) => (
              <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                {t}
              </span>
            ))}
          </div>
          {project.isMember && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={project.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Task Board */}
        <ProjectTaskBoard
          projectId={project.id}
          isMember={project.isMember}
          isCreator={isCreator}
          members={project.members.filter((m): m is { name: string; avatar: string; user_id: string } => !!m.user_id)}
        />

        {/* Team Chat */}
        <div className="mt-8">
          <ProjectTeamChat projectId={project.id} isMember={project.isMember} />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;
