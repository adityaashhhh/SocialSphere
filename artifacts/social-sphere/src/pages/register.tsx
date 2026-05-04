import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await register({ username, email, displayName, password });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-md relative z-10 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20 mb-4 animate-bounce-slow">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Join SocialSphere</h1>
          <p className="text-muted-foreground font-medium">Create your digital presence.</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-white text-center">Get Started</CardTitle>
            <CardDescription className="text-center text-zinc-400">Join thousands of people sharing their worlds</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-primary/50 transition-all"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-primary/50 transition-all"
                />
                <Input
                  placeholder="Display Name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-primary/50 transition-all"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-primary/50 transition-all"
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-2xl focus:ring-primary/50 transition-all"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98] mt-2" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-400">
                Already part of the sphere?{" "}
                <Link href="/login" className="text-primary font-bold hover:text-accent transition-colors">
                  Log in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}