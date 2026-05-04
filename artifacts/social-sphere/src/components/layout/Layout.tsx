import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { 
  Home, 
  Compass, 
  Bell, 
  MessageCircle, 
  User as UserIcon, 
  LogOut, 
  Moon, 
  Sun,
  Globe
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function Layout({ children, rightSlot }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Use state for dark mode toggle simply
  const [isDark, setIsDark] = React.useState(true);

  const toggleDark = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: `/profile/${user?.id}`, label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center selection:bg-primary/30">
      {/* Left Sidebar */}
      <aside className="w-20 md:w-64 border-r border-border/50 fixed left-0 h-screen hidden sm:flex flex-col justify-between py-8 px-2 md:px-6 bg-card/30 backdrop-blur-xl z-50">
        <div>
          <Link href="/" className="flex items-center gap-3 px-3 mb-12 group transition-transform active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="hidden md:inline font-bold text-2xl tracking-tighter text-gradient">SocialSphere</span>
          </Link>

          <nav className="flex flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.label} href={item.href} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-primary/5"}`}>
                  <div className="relative">
                    <Icon className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${isActive ? "scale-110" : ""}`} />
                    {isActive && (
                      <motion.div 
                        layoutId="nav-glow" 
                        className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10"
                      />
                    )}
                  </div>
                  <span className="hidden md:inline text-lg">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator" 
                      className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <Button 
            variant="ghost" 
            onClick={toggleDark} 
            className="justify-start gap-4 px-4 py-7 rounded-2xl w-full hover:bg-primary/5 group transition-all"
          >
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <span className="hidden md:inline text-lg font-medium">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          {user && (
            <div className="p-2 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all group relative">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                  <AvatarImage src={user.profilePicture || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.displayName?.[0] || user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block flex-1 min-w-0">
                  <p className="font-bold text-sm truncate leading-none mb-1">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground truncate leading-none">@{user.username}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => void logout()}
                >
                  <LogOut className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full sm:w-[calc(100%-5rem)] md:w-[calc(100%-16rem)] lg:w-[650px] flex-shrink-0 min-h-screen border-x border-border/50 sm:ml-20 md:ml-64 lg:mx-0 bg-background/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none h-64 -z-10" />
        {children}
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 hidden lg:block sticky top-0 h-screen p-8">
        <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 h-[calc(100vh-4rem)]">
          {rightSlot}
        </div>
      </aside>

      {/* Mobile Nav (Bottom) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 glass-nav px-6 py-4 flex justify-around z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.label} href={item.href} className={`relative p-2 rounded-xl transition-all ${isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-6 h-6" />
              {isActive && (
                <motion.div 
                  layoutId="mobile-indicator" 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}