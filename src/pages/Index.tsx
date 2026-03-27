import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, Users, FolderKanban } from "lucide-react";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  created_by: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  college_name: string | null;
  college_email: string | null;
}

const Index = () => {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [tab, setTab] = useState<"projects" | "users">("projects");

  const fetchData = async () => {
    const [projectRes, userRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name, college_name, college_email"),
    ]);
    if (projectRes.data) setProjects(projectRes.data);
    if (userRes.data) setUsers(userRes.data);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete project");
    } else {
      toast.success("Project deleted");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,30%,6%)] text-[hsl(220,15%,90%)]">
      <HeroSection />

      {isAdmin && (
        <section className="container mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[hsl(220,15%,90%)]">Admin Panel</h2>
              <p className="text-[hsl(220,10%,55%)] mt-1">Manage projects and users</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === "projects" ? "default" : "outline"}
              size="sm"
              className="gap-2 rounded-lg font-mono text-xs"
              onClick={() => setTab("projects")}
            >
              <FolderKanban className="w-4 h-4" /> Projects ({projects.length})
            </Button>
            <Button
              variant={tab === "users" ? "default" : "outline"}
              size="sm"
              className="gap-2 rounded-lg font-mono text-xs"
              onClick={() => setTab("users")}
            >
              <Users className="w-4 h-4" /> Users ({users.length})
            </Button>
          </div>

          {tab === "projects" && (
            <div className="space-y-3">
              {projects.length === 0 && (
                <p className="text-center py-10 text-muted-foreground font-mono">No projects yet</p>
              )}
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[hsl(222,22%,10%)]/80 backdrop-blur-xl border border-[hsl(222,18%,18%)] rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-semibold truncate">{project.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize">{project.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 rounded-lg shrink-0"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-3">
              {users.length === 0 && (
                <p className="text-center py-10 text-muted-foreground font-mono">No users yet</p>
              )}
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className="glass-card rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono font-bold">
                    {(u.display_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold truncate">{u.display_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {u.college_name || "No college"} · {u.college_email || "No college email"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Index;
