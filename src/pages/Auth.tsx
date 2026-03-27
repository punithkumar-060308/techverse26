import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Upload, CreditCard, Eye, EyeOff, Shield } from "lucide-react";
import CodeRainBackground from "@/components/CodeRainBackground";

const isCollegeEmail = (email: string) => {
  return email.endsWith(".edu.in") || email.endsWith(".ac.in");
};

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeIdNumber, setCollegeIdNumber] = useState("");
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);

  const needsCollegeId = !isLogin && email && !isCollegeEmail(email);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        // Signup validation
        if (!displayName.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        if (!collegeName.trim()) {
          toast.error("Please enter your college name");
          setLoading(false);
          return;
        }
        if (needsCollegeId && !collegeIdNumber && !collegeIdFile) {
          toast.error("Please provide your college ID number or upload your college ID card");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Update profile with college info
        if (data.user) {
          let collegeIdImageUrl: string | null = null;

          // Upload college ID if provided
          if (collegeIdFile) {
            const fileExt = collegeIdFile.name.split(".").pop();
            const filePath = `${data.user.id}/college-id.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from("college-ids")
              .upload(filePath, collegeIdFile);
            if (uploadError) {
              console.error("Upload error:", uploadError);
            } else {
              collegeIdImageUrl = filePath;
            }
          }

          await supabase.from("profiles").update({
            college_name: collegeName,
            college_id_number: collegeIdNumber || null,
            college_id_image_url: collegeIdImageUrl,
            is_college_email_verified: isCollegeEmail(email),
          }).eq("user_id", data.user.id);
        }

        toast.success("Account created! Check your email to verify.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || `${provider} sign-in failed`);
      }
    } catch (error: any) {
      toast.error(error.message || "OAuth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <CodeRainBackground />
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-mono font-bold text-lg">{`</>`}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Join DevCollab"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin ? "Sign in to your account" : "Create your student account"}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-mono">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu.in or gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl"
                  required
                />
              </div>
              {!isLogin && email && (
                <p className={`text-xs ${isCollegeEmail(email) ? "text-accent" : "text-amber-500"}`}>
                  {isCollegeEmail(email)
                    ? "✓ College email detected — no ID verification needed"
                    : "⚠ Non-college email — please provide your college ID below"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="college" className="text-sm font-medium">College Name</Label>
                <Input
                  id="college"
                  placeholder="e.g. IIT Delhi, VIT Vellore"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}

            {needsCollegeId && (
              <div className="space-y-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                <p className="text-sm font-medium text-destructive">College ID Verification</p>
                
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-sm">College ID Number (optional)</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="idNumber"
                      placeholder="e.g. 21BCE1234"
                      value={collegeIdNumber}
                      onChange={(e) => setCollegeIdNumber(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idUpload" className="text-sm">Upload College ID Card (optional)</Label>
                  <div className="relative">
                    <label
                      htmlFor="idUpload"
                      className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {collegeIdFile ? collegeIdFile.name : "Click to upload ID card image"}
                      </span>
                    </label>
                    <input
                      id="idUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Provide either your ID number, upload your ID card, or both.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>


          {isLogin && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("Please enter your email first");
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success("Password reset link sent! Check your email.");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to send reset email");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-sm text-primary hover:underline font-medium"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
