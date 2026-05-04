import { useGetPost } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/posts/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [, setLocation] = useLocation();
  const { data: post, isLoading } = useGetPost(postId ?? "");

  return (
    <Layout>
      <div className="sticky top-0 z-40 glass-nav px-6 py-5 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-black text-2xl tracking-tighter">Post</h1>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : post ? (
          <PostCard post={post as any} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl font-bold mb-2">Post not found</h2>
            <p className="text-muted-foreground mb-6">This post may have been deleted.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
