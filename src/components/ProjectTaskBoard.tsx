import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  projectId: string;
  isMember: boolean;
  isCreator: boolean;
  members: { name: string; avatar: string; user_id: string }[];
}

interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

const statusColumns = [
  { id: "todo", label: "To Do", color: "text-muted-foreground" },
  { id: "in-progress", label: "In Progress", color: "text-yellow-400" },
  { id: "review", label: "Review", color: "text-blue-400" },
  { id: "done", label: "Done", color: "text-green-400" },
];

const priorityColors: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

const ProjectTaskBoard = ({ projectId, isMember, isCreator, members }: Props) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAssignee, setNewAssignee] = useState<string>("unassigned");
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (data) setTasks(data as ProjectTask[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime
  useEffect(() => {
    const sub = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_tasks", filter: `project_id=eq.${projectId}` },
        () => fetchTasks()
      )
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [projectId, fetchTasks]);

  const createTask = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("project_tasks").insert({
      project_id: projectId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      assigned_to: newAssignee === "unassigned" ? null : newAssignee,
      created_by: user.id,
    });
    if (error) toast.error("Failed to create task");
    else {
      toast.success("Task created!");
      setDialogOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("medium");
      setNewAssignee("unassigned");
    }
    setCreating(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("project_tasks")
      .update({ status: newStatus })
      .eq("id", taskId);
    if (error) toast.error("Failed to update task");
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", taskId);
    if (error) toast.error("Failed to delete task");
    else toast.success("Task deleted");
  };

  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const m = members.find((mem) => mem.user_id === userId);
    return m?.name || "User";
  };

  const getMemberAvatar = (userId: string | null) => {
    if (!userId) return null;
    const m = members.find((mem) => mem.user_id === userId);
    return m?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-mono">Task Board</h2>
        {isCreator && (
          <Button size="sm" className="gap-1 rounded-lg" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="min-w-[240px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${col.color.replace("text-", "bg-")}`} />
                <h3 className="font-mono font-semibold text-sm">{col.label}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {colTasks.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <div key={task.id} className="glass-card rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium leading-tight">{task.title}</p>
                      <Flag className={`w-3 h-3 shrink-0 mt-0.5 ${priorityColors[task.priority] || ""}`} />
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      {task.assigned_to && (
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={getMemberAvatar(task.assigned_to) || ""} />
                          <AvatarFallback className="text-[8px]">
                            {(getMemberName(task.assigned_to) || "U")[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {isMember && (
                        <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v)}>
                          <SelectTrigger className="h-6 text-[10px] w-24 ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusColumns.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {isCreator && (
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 font-mono">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1 rounded-xl" placeholder="Task title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="mt-1 rounded-xl" placeholder="Optional description" rows={3} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Assign to</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={createTask} disabled={creating || !newTitle.trim()}>
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTaskBoard;
