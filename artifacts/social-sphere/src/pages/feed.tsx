import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import {
  useGetFeed,
  useGetSuggestedUsers,
  getGetFeedQueryKey,
  getGetSuggestedUsersQueryKey,
  Post,
  UserSummary,
} from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import UserSuggestionCard from "@/components/users/UserSuggestionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function PostSkeleton() {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-6 mt-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}


function SuggestionsSidebar() {
  const { data, isLoading } = useGetSuggestedUsers({
    query: { queryKey: getGetSuggestedUsersQueryKey() },
  });
  const suggestions = data as UserSummary[] | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions?.length) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h3 className="font-black text-lg tracking-tight flex items-center gap-2 mb-4">
          Suggested for you
        </h3>
        <div className="flex flex-col gap-1">
          {suggestions.map((u) => (
            <UserSuggestionCard key={u.id} user={u} />
          ))}
        </div>
      </div>
      
      <div className="px-2 pt-4 border-t border-border/50">
        <p className="text-[11px] font-bold text-muted-foreground/50 tracking-wider uppercase">
          © 2026 SocialSphere from Gemini
        </p>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetFeed(
    { page },
    { query: { queryKey: getGetFeedQueryKey({ page }) } },
  );

  const postsPage = data as any;
  const posts: Post[] = (postsPage?.posts ?? []) as Post[];
  const hasMore = postsPage?.hasMore ?? false;

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  return (
    <Layout rightSlot={<SuggestionsSidebar />}>
      <div className="sticky top-0 z-40 glass-nav px-6 py-5">
        <div className="flex items-center justify-between">
          <h1 className="font-black text-2xl tracking-tighter">Home Feed</h1>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/20 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <CreatePost />

      <div className="divide-y divide-border/50">
        {isLoading && page === 1 ? (
          <div>
            {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-[2.5rem] flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Sphere is Quiet</h2>
            <p className="text-muted-foreground font-medium max-w-xs">
              Follow some people to fill your feed with stories and moments.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {posts.map((post: Post, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  type: "spring",
                  damping: 25,
                  stiffness: 120,
                  delay: index < 5 ? index * 0.1 : 0 
                }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {hasMore && (
        <div className="p-8 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="h-12 px-10 rounded-2xl font-bold border-2 hover:bg-muted transition-all active:scale-95"
            data-testid="load-more"
          >
            {isFetching ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                Loading...
              </div>
            ) : "Explore More"}
          </Button>
        </div>
      )}
    </Layout>
  );
}
