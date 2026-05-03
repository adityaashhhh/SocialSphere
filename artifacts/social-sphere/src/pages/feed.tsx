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
      <div className="bg-card rounded-2xl border border-border p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!suggestions?.length) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" />
        People you may know
      </h3>
      <div className="divide-y divide-border/50">
        {suggestions.map((u) => (
          <UserSuggestionCard key={u.id} user={u} />
        ))}
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
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="font-bold text-xl">Home</h1>
      </div>

      <CreatePost />

      {isLoading && page === 1 ? (
        <div>
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="bg-primary/10 rounded-full p-6 mb-4">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your feed is empty</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Follow some people to see their posts here. Check out the Explore page to discover creators.
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {posts.map((post: Post, index: number) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: index < 5 ? index * 0.05 : 0 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {hasMore && (
        <div className="p-4 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
            data-testid="load-more"
          >
            {isFetching ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </Layout>
  );
}
