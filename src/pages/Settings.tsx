import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setCollegeName(data.college_name || "");
        setDepartment(data.department || "");
        setCollegeEmail(data.college_email || user.email || "");
      }
      if (error) console.error(error);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // First check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing profile
      const result = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          username,
          bio,
          college_name: collegeName,
          department,
        })
        .eq("user_id", user.id);
      error = result.error;
    } else {
      // Insert new profile if none exists
      const result = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          display_name: displayName,
          username,
          bio,
          college_name: collegeName,
          department,
          college_email: user.email || null,
        });
      error = result.error;
    }

    if (error) {
      console.error("Profile save error:", error);
      toast.error("Failed to save profile: " + error.message);
    } else {
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-mono font-semibold text-lg mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Display Name</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 rounded-xl" placeholder="@username" />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-sm">Bio</Label>
                  <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5 rounded-xl" placeholder="Tell us about yourself" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="mt-1.5 rounded-xl opacity-60" />
                </div>
              </div>
            </div>

            {/* College Info */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-mono font-semibold text-lg mb-4">College Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="college" className="text-sm">College Name</Label>
                  <Input id="college" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="department" className="text-sm">Department</Label>
                  <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1.5 rounded-xl" placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <Label htmlFor="collegeEmail" className="text-sm">College Email</Label>
                  <Input id="collegeEmail" value={collegeEmail} disabled className="mt-1.5 rounded-xl opacity-60" />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>

            {/* Notifications */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-mono font-semibold text-lg mb-4">Notifications</h2>
              <div className="space-y-4">
                {[
                  { label: "Email notifications", desc: "Receive updates about your projects" },
                  { label: "Task assignments", desc: "Get notified when assigned a task" },
                  { label: "Chat messages", desc: "Notify on new team messages" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-6 border-destructive/30">
              <h2 className="font-mono font-semibold text-lg mb-2 text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all data.</p>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={async () => {
                  if (!confirm("Are you sure? This will permanently delete your account and all your data. This cannot be undone.")) return;
                  try {
                    const { error } = await supabase.functions.invoke("delete-account");
                    if (error) throw error;
                    await supabase.auth.signOut();
                    toast.success("Account deleted successfully");
                    navigate("/auth");
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete account");
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Settings;
