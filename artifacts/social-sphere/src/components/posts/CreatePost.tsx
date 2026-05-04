import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Users, Lock, ImagePlus, Send, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePost,
  getGetFeedQueryKey,
  getGetExplorePostsQueryKey,
  CreatePostBodyVisibility,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visibilityOptions = [
  { value: "public", label: "Everyone", icon: Globe },
  { value: "followers", label: "Followers", icon: Users },
  { value: "private", label: "Only me", icon: Lock },
];

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<CreatePostBodyVisibility>("public");
  const [expanded, setExpanded] = useState(false);
  const [media, setMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createPost = useCreatePost();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        // Auth token is handled by browser cookies if available, 
        // or we might need to add it if it's in localStorage.
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setMedia({ url: data.url, type: data.type });
      setExpanded(true);
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !media) return;
    
    createPost.mutate(
      { 
        data: { 
          content, 
          visibility, 
          media: media ? [media] : [] 
        } 
      },
      {
        onSuccess: () => {
          setContent("");
          setMedia(null);
          setExpanded(false);
          toast({ title: "Post shared!" });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExplorePostsQueryKey() });
        },
        onError: () => toast({ title: "Failed to post", variant: "destructive" }),
      },
    );
  };

  if (!user) return null;

  return (
    <div className="bg-card border-b border-border/50 p-6 transition-all duration-500" data-testid="create-post">
      <div className="flex gap-4">
        <Avatar className="w-12 h-12 flex-shrink-0 shadow-sm">
          <AvatarImage src={user.profilePicture ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
            {(user.displayName?.[0] ?? user.username[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className={`transition-all duration-500 ${expanded ? "mb-4" : ""}`}>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder="What's happening?"
              className="w-full resize-none bg-transparent border-none shadow-none focus-visible:ring-0 text-lg md:text-xl font-medium placeholder:text-muted-foreground/60 p-0 min-h-[48px] leading-relaxed"
              rows={expanded ? 4 : 1}
              data-testid="post-textarea"
            />
          </div>

          <AnimatePresence>
            {media && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mt-4 mb-6 rounded-2xl overflow-hidden group border border-border/50 shadow-lg"
              >
                <img 
                  src={media.url} 
                  alt="Upload preview" 
                  className="w-full max-h-[400px] object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                  onClick={() => setMedia(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />

          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50"
              >
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:bg-primary/10 rounded-full h-10 px-4 transition-colors font-bold" 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ImagePlus className="w-5 h-5 mr-2" />
                    )}
                    Media
                  </Button>
                  
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as CreatePostBodyVisibility)}>
                    <SelectTrigger className="h-10 w-36 text-sm bg-muted/50 border-none rounded-full px-4 font-bold" data-testid="visibility-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 rounded-2xl">
                      {visibilityOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-xl">
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExpanded(false); setContent(""); setMedia(null); }}
                    className="text-muted-foreground font-bold hover:bg-muted/80 rounded-full h-10 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={createPost.isPending || isUploading || (!content.trim() && !media)}
                    className="h-10 px-8 rounded-full font-black bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    data-testid="post-submit"
                  >
                    {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Post
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
