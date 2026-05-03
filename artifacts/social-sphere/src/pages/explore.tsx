import { useState, useEffect, useRef } from "react";
import { Search, Compass } from "lucide-react";
import { Link } from "wouter";
import {
  useGetExplorePosts,
  useSearchUsers,
  getGetExplorePostsQueryKey,
  getSearchUsersQueryKey,
  Post,
  UserSummary,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/posts/PostCard";
import UserSuggestionCard from "@/components/users/UserSuggestionCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const { data: explorePosts, isLoading: postsLoading } = useGetExplorePosts(
    undefined,
    { query: { queryKey: getGetExplorePostsQueryKey() } },
  );

  const searchEnabled = debouncedQuery.trim().length >= 1;
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(
    { q: debouncedQuery },
    {
      query: {
        enabled: searchEnabled,
        queryKey: getSearchUsersQueryKey({ q: debouncedQuery }),
      },
    },
  );

  const posts = (explorePosts as any)?.posts as Post[] | undefined;
  const users = searchResults as UserSummary[] | undefined;

  const content = (
    <>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="font-bold text-xl mb-3 flex items-center gap-2">
          <Compass className="w-5 h-5 text-accent" />
          Explore
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="pl-9 bg-muted/30"
            data-testid="search-input"
          />
        </div>
      </div>

      {searchEnabled ? (
        <div className="p-4">
          <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
            People
          </h2>
          {searchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="divide-y divide-border/50">
              {users.map((u) => (
                <UserSuggestionCard key={u.id} user={u} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No users found for "{debouncedQuery}"</p>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Trending Posts
            </h2>
          </div>
          {postsLoading ? (
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border-b border-border">
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <PostGrid posts={posts} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Compass className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No posts to explore yet</p>
            </div>
          )}
        </>
      )}
    </>
  );

  if (isAuthenticated) {
    return <Layout>{content}</Layout>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {content}
    </div>
  );
}
