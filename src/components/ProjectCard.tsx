import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Users, LogIn, LogOut } from "lucide-react";
import type { Project } from "@/lib/mock-data";

const statusStyles: Record<Project["status"], string> = {
  active: "bg-success/15 text-success border-success/30",
  planning: "bg-warning/15 text-warning border-warning/30",
  completed: "bg-muted text-muted-foreground border-border",
};

interface ProjectCardProps {
  project: Project;
  onJoin?: (projectId: string) => void;
  onLeave?: (projectId: string) => void;
}

const ProjectCard = ({ project, onJoin, onLeave }: ProjectCardProps) => {
  const navigate = useNavigate();
  const isFull = project.memberCount >= project.maxMembers;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 animate-fade-in group"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-mono font-semibold text-lg transition-colors duration-200 group-hover:text-primary">
          {project.name}
        </h3>
        <Badge variant="outline" className={statusStyles[project.status]}>
          {project.status}
        </Badge>
      </div>

      <p className="text-muted-foreground text-sm mb-5 line-clamp-2 leading-relaxed">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {project.tech.map((t) => (
          <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
            {t}
          </span>
        ))}
      </div>

      {/* Member count */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {project.memberCount}/{project.maxMembers} members
        </span>
        {isFull && (
          <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
            Full
          </Badge>
        )}
      </div>

      {/* Member avatars */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m) => (
            <Avatar key={m.name} className="w-7 h-7 border-2 border-card">
              <AvatarImage src={m.avatar} />
              <AvatarFallback className="text-xs">{m.name[0]}</AvatarFallback>
            </Avatar>
          ))}
          {project.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border-2 border-card">
              +{project.members.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {project.updatedAt}
          </span>
          {project.isMember ? (
            onLeave && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs rounded-lg gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave(project.id);
                }}
              >
                <LogOut className="w-3 h-3" /> Leave
              </Button>
            )
          ) : (
            onJoin && !isFull && (
              <Button
                size="sm"
                className="h-7 text-xs rounded-lg gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin(project.id);
                }}
              >
                <LogIn className="w-3 h-3" /> Join
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
