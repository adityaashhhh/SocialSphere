import { Link } from "wouter";
import { Globe, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="bg-primary/20 p-4 rounded-full">
            <Globe className="w-16 h-16 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-8xl font-black text-primary/20 leading-none">404</h1>
          <h2 className="text-2xl font-bold mt-2">Page not found</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            This page doesn't exist or was moved. Let's get you back on track.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
