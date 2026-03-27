import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TeamChat from "@/components/TeamChat";

interface ProfileData {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  college_name: string | null;
  department: string | null;
}

const Team = () => {
  const [members, setMembers] = useState<ProfileData[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, college_name, department")
      .then(({ data }) => {
        if (data) setMembers(data);
      });
  }, []);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">Collaborate with your team in real-time</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Chat area */}
          <TeamChat />

          {/* Members sidebar */}
          <div className="space-y-4">
            <h2 className="font-mono font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Members ({members.length})
            </h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="glass-card rounded-xl p-3 flex items-center gap-3 transition-all duration-200 hover:border-primary/30"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                    />
                    <AvatarFallback className="text-xs">
                      {(member.display_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium truncate">
                      {member.display_name || member.username || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {member.department || member.college_name || "Team member"}
                    </p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 font-mono">
                  No team members yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
