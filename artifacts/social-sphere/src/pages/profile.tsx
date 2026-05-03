import { useState } from "react";
import { useRoute } from "wouter";
import { Grid3x3, Heart, Calendar, UserPlus, UserCheck, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserProfile,
  useGetUserPosts,
  useToggleFollow,
  useUpdateUserProfile,
  useGetFollowers,
  useGetFollowing,
  getGetUserProfileQueryKey,
  getGetUserPostsQueryKey,
  getGetFeedQueryKey,
  getGetFollowersQueryKey,
  getGetFollowingQueryKey,
  Post,
  UserSummary,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/posts/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/time";
import { Label } from "@/components/ui/label";

function FollowListDialog({
  title,
  userId,
  type,
  open,
  onClose,
}: {
  title: string;
  userId: string;
  type: "followers" | "following";
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useGetFollowers(userId, {
    query: { enabled: type === "followers" && open, queryKey: getGetFollowersQueryKey(userId) },
  });
  const { data: followingData } = useGetFollowing(userId, {
    query: { enabled: type === "following" && open, queryKey: getGetFollowingQueryKey(userId) },
  });
  const users = (type === "followers" ? data : followingData) as UserSummary[] | undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={u.profilePicture ?? undefined} />
                <AvatarFallback>{(u.displayName?.[0] ?? "?").toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{u.displayName}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </div>
          ))}
          {!users?.length && (
            <p className="text-muted-foreground text-sm py-4 text-center">No {type} yet</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  open,
  onClose,
  userId,
  currentDisplayName,
  currentBio,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentDisplayName: string;
  currentBio?: string | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [bio, setBio] = useState(currentBio ?? "");

  const updateProfile = useUpdateUserProfile();

  const handleSave = () => {
    updateProfile.mutate(
      { pathParams: { userId }, data: { displayName, bio } } as any,
      {
        onSuccess: () => {
          toast({ title: "Profile updated!" });
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
          onClose();
        },
        onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1"
              data-testid="edit-display-name"
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the world about yourself..."
              className="mt-1 resize-none"
              data-testid="edit-bio"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending || !displayName.trim()}
            className="w-full"
            data-testid="save-profile"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId ?? "";
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { data: profile, isLoading } = useGetUserProfile(userId, {
    query: {
      queryKey: getGetUserProfileQueryKey(userId),
      enabled: !!userId,
      onSuccess: (data: any) => {
        if (isFollowing === null) setIsFollowing(data.isFollowing);
      },
    } as any,
  });

  const { data: postsData, isLoading: postsLoading } = useGetUserPosts(userId, undefined, {
    query: {
      queryKey: getGetUserPostsQueryKey(userId),
      enabled: !!userId,
    },
  });

  const toggleFollowMutation = useToggleFollow();
  const posts = (postsData as any)?.posts as Post[] | undefined;
  const isOwnProfile = currentUser?.id === userId;
  const effectiveFollowing = isFollowing ?? profile?.isFollowing ?? false;

  const handleFollow = () => {
    const newFollowing = !effectiveFollowing;
    setIsFollowing(newFollowing);
    toggleFollowMutation.mutate(
      { pathParams: { userId } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          toast({ title: newFollowing ? `Following ${profile?.displayName}` : `Unfollowed ${profile?.displayName}` });
        },
        onError: () => {
          setIsFollowing(!newFollowing);
          toast({ title: "Failed to update follow", variant: "destructive" });
        },
      },
    );
  };

  if (!userId) return null;

  return (
    <Layout>
      {isLoading ? (
        <div>
          <Skeleton className="h-32 w-full" />
          <div className="p-4">
            <Skeleton className="w-20 h-20 rounded-full -mt-10 mb-3" />
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Cover */}
          <div
            className="h-36 bg-gradient-to-br from-primary/30 to-accent/30 relative"
            style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          />

          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <Avatar className="w-20 h-20 border-4 border-background">
                <AvatarImage src={profile.profilePicture ?? undefined} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                  {(profile.displayName?.[0] ?? profile.username[0]).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2 mt-12">
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditProfile(true)}
                    className="gap-2"
                    data-testid="edit-profile-btn"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={effectiveFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                    disabled={toggleFollowMutation.isPending}
                    className="gap-2"
                    data-testid="follow-profile-btn"
                  >
                    {effectiveFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {effectiveFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h1 className="text-xl font-bold">{profile.displayName || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="w-3.5 h-3.5" />
                Joined {timeAgo(profile.createdAt)}
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <button onClick={() => setShowFollowing(true)} className="hover:underline" data-testid="following-count">
                <span className="font-bold">{profile.followingCount}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </button>
              <button onClick={() => setShowFollowers(true)} className="hover:underline" data-testid="followers-count">
                <span className="font-bold">{profile.followersCount}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </button>
              <div>
                <span className="font-bold">{profile.postsCount}</span>
                <span className="text-muted-foreground ml-1">Posts</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
              <TabsTrigger
                value="posts"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 gap-2"
              >
                <Heart className="w-4 h-4" />
                Liked
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              {postsLoading ? (
                <div>
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border-b border-border">
                      <div className="flex gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="flex flex-col items-center py-16 text-center px-4">
                  <Grid3x3 className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              <div className="flex flex-col items-center py-16 text-center px-4">
                <Heart className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Liked posts coming soon</p>
              </div>
            </TabsContent>
          </Tabs>

          <FollowListDialog
            title="Followers"
            userId={userId}
            type="followers"
            open={showFollowers}
            onClose={() => setShowFollowers(false)}
          />
          <FollowListDialog
            title="Following"
            userId={userId}
            type="following"
            open={showFollowing}
            onClose={() => setShowFollowing(false)}
          />
          {showEditProfile && (
            <EditProfileDialog
              open={showEditProfile}
              onClose={() => setShowEditProfile(false)}
              userId={userId}
              currentDisplayName={profile.displayName}
              currentBio={profile.bio}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">User not found</p>
        </div>
      )}
    </Layout>
  );
}
