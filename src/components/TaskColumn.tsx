import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Flag } from "lucide-react";
import type { Task } from "@/lib/mock-data";

const priorityColors: Record<Task["priority"], string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

const columnConfig: Record<Task["status"], { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-muted-foreground" },
  "in-progress": { label: "In Progress", color: "bg-primary" },
  review: { label: "Review", color: "bg-warning" },
  done: { label: "Done", color: "bg-success" },
};

const TaskCard = ({ task }: { task: Task }) => (
  <div className="glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
      <Flag className={`w-3.5 h-3.5 flex-shrink-0 ml-2 ${priorityColors[task.priority]}`} />
    </div>
    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
    <div className="flex items-center justify-between">
      <div className="flex gap-1">
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {tag}
          </span>
        ))}
      </div>
      {task.assignee && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={task.assignee.avatar} />
          <AvatarFallback className="text-[10px]">{task.assignee.name[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  </div>
);

const TaskColumn = ({ status, tasks }: { status: Task["status"]; tasks: Task[] }) => {
  const config = columnConfig[status];
  const filtered = tasks.filter((t) => t.status === status);

  return (
    <div className="flex flex-col min-w-[280px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <span className="font-mono font-semibold text-sm">{config.label}</span>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
          {filtered.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;
