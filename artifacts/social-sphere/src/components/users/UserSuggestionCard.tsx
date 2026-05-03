import { useState } from "react";
import { Link } from "wouter";
import { UserPlus, UserCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserSummary,
  useToggleFollow,
  getGetSuggestedUsersQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserSuggestionCardProps {
  user: UserSummary;
}

export default function UserSuggestionCard({ user }: UserSuggestionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    toggleFollow.mutate(
      { data: { userId: user.id } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSuggestedUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(user.id) });
          toast({ title: newFollowing ? `Following ${user.displayName}` : `Unfollowed ${user.displayName}` });
        },
        onError: () => {
          setIsFollowing(!newFollowing);
          toast({ title: "Failed to update follow", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-3 py-2" data-testid="suggestion-card">
      <Link href={`/profile/${user.id}`}>
        <Avatar className="w-9 h-9 cursor-pointer flex-shrink-0">
          <AvatarImage src={user.profilePicture ?? undefined} />
          <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
            {(user.displayName?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.id}`}>
          <p className="text-sm font-semibold truncate hover:underline cursor-pointer">
            {user.displayName}
          </p>
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          {user.followersCount} follower{user.followersCount !== 1 ? "s" : ""}
        </p>
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "secondary" : "default"}
        className="h-8 px-3 text-xs flex-shrink-0 gap-1"
        onClick={handleFollow}
        disabled={toggleFollow.isPending}
        data-testid="follow-button"
      >
        {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
