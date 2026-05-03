import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
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
  const [location] = useLocation();
  
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
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      {/* Left Sidebar */}
      <aside className="w-20 md:w-64 border-r border-border fixed left-0 h-screen hidden sm:flex flex-col justify-between py-6 px-2 md:px-4">
        <div>
          <Link href="/" className="flex items-center gap-3 px-2 mb-8 text-primary font-bold text-xl">
            <Globe className="w-8 h-8" />
            <span className="hidden md:inline">SocialSphere</span>
          </Link>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.label} href={item.href} className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>
                  <Icon className="w-6 h-6" />
                  <span className="hidden md:inline text-lg">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <Button variant="ghost" onClick={toggleDark} className="justify-start gap-4 px-4 py-6 rounded-full w-full">
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            <span className="hidden md:inline text-lg">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          {user && (
            <div className="flex items-center gap-3 px-2 group cursor-pointer relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.profilePicture || undefined} />
                <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user.displayName || user.username}</p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 hidden md:flex absolute right-0 z-10"
                onClick={() => void logout()}
              >
                <LogOut className="w-5 h-5 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full sm:w-[calc(100%-5rem)] md:w-[calc(100%-16rem)] lg:w-[600px] flex-shrink-0 min-h-screen border-r border-border sm:ml-20 md:ml-64 lg:mx-0">
        {children}
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 hidden lg:block sticky top-0 h-screen p-6">
        {rightSlot}
      </aside>

      {/* Mobile Nav (Bottom) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background flex justify-around p-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.label} href={item.href} className={`p-3 rounded-full transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}