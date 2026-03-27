import { ArrowRight, Code2, Users, Kanban, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-illustration.png";
import CodeRainBackground from "@/components/CodeRainBackground";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[hsl(222,30%,6%)]">
      <CodeRainBackground />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(222,30%,6%)/60%] to-[hsl(222,30%,6%)]" />

      <div className="container relative z-10 mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Build <span className="text-gradient">together</span>,{" "}
              <br />
              ship faster.
            </h1>

            <p className="text-lg text-[hsl(220,10%,55%)] max-w-lg mb-10 font-sans leading-relaxed">
              The collaboration hub where student developers create projects, 
              manage tasks, and build amazing things as a team.
            </p>

            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button
                  size="lg"
                  className="gap-2 text-base px-8 h-12 rounded-xl transition-transform duration-200 hover:scale-105"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="gap-2 text-base px-8 h-12 rounded-xl transition-transform duration-200 hover:scale-105"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 text-base px-8 h-12 rounded-xl transition-colors duration-200 hover:bg-accent"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:block animate-scale-in">
            <div className="relative">
              <img
                src={heroImage}
                alt="Developer collaboration illustration"
                className="relative rounded-2xl border border-border/50 shadow-2xl transition-shadow duration-300 hover:shadow-primary/10"
              />
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-24 grid sm:grid-cols-3 gap-6">
          {[
            { icon: Code2, title: "Create Projects", desc: "Spin up new projects and invite your team in seconds", path: "/projects" },
            { icon: Kanban, title: "Manage Tasks", desc: "Kanban boards, assignments, and progress tracking", path: "/dashboard" },
            { icon: Users, title: "Collaborate", desc: "Real-time updates, comments, and team coordination", path: "/team" },
          ].map((feature, i) => (
            <div
              key={feature.title}
              onClick={() => navigate(user ? feature.path : "/auth")}
              className="bg-[hsl(222,22%,10%)]/80 backdrop-blur-xl border border-[hsl(222,18%,18%)] shadow-lg rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/40 group cursor-pointer"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-primary/20">
                <feature.icon className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="font-mono font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-[hsl(220,10%,55%)] text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
