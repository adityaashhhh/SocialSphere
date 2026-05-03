import { useState } from "react";
import { Globe, Users, Lock, ImagePlus, Send } from "lucide-react";
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
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<CreatePostBodyVisibility>("public");
  const [expanded, setExpanded] = useState(false);

  const createPost = useCreatePost();

  const handleSubmit = () => {
    if (!content.trim()) return;
    createPost.mutate(
      { data: { content, visibility } },
      {
        onSuccess: () => {
          setContent("");
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
    <div className="bg-card border-b border-border p-4" data-testid="create-post">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={user.profilePicture ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {(user.displayName?.[0] ?? user.username[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind?"
            className="w-full resize-none bg-transparent border-none shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground p-0 min-h-[40px]"
            rows={expanded ? 3 : 1}
            data-testid="post-textarea"
          />

          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" type="button">
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-sm">Photo</span>
                </Button>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as CreatePostBodyVisibility)}>
                  <SelectTrigger className="h-8 w-36 text-sm bg-muted/30" data-testid="visibility-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setExpanded(false); setContent(""); }}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createPost.isPending || !content.trim()}
                  className="gap-1.5"
                  data-testid="post-submit"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
