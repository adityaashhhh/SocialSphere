import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Share2, MoreHorizontal, Pencil, Trash2, X, Check, Users, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Post,
  useTogglePostLike,
  useDeletePost,
  useUpdatePost,
  getGetFeedQueryKey,
  getGetExplorePostsQueryKey,
  getGetUserPostsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/time";
import CommentSection from "./CommentSection";
import { Input } from "@/components/ui/input";

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetExplorePostsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.id) });
    queryClient.invalidateQueries({ queryKey: ["getPost", post.id] });
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey(), exact: false });
  };

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    if (newLiked) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 400);
    }
    toggleLike.mutate(
      { postId: post.id },
      {
        onError: () => {
          setIsLiked(!newLiked);
          setLikesCount((c) => (newLiked ? c - 1 : c + 1));
        },
        onSuccess: () => invalidatePosts(),
      },
    );
  };

  const handleDelete = () => {
    deletePost.mutate(
      { postId: post.id },
      {
        onSuccess: () => {
          toast({ title: "Post deleted" });
          invalidatePosts();
          onDelete?.();
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      },
    );
  };

  const handleEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate(
      { postId: post.id, data: { content: editContent } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Post updated" });
          invalidatePosts();
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      },
    );
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/profile/${post.author.id}`);
    toast({ title: "Link copied to clipboard" });
    setShowShareDialog(false);
  };

  const isOwn = user?.id === post.author.id;

  return (
    <article className="bg-card border-b border-border p-4 hover:bg-card/80 transition-colors" data-testid="post-card">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="w-10 h-10 cursor-pointer flex-shrink-0">
            <AvatarImage src={post.author.profilePicture ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {(post.author.displayName?.[0] ?? post.author.username[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.author.id}`}>
                <span className="font-semibold hover:underline cursor-pointer">
                  {post.author.displayName || post.author.username}
                </span>
              </Link>
              <span className="text-muted-foreground text-sm">@{post.author.username}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo(post.createdAt)}</span>
            </div>

            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" data-testid="post-menu">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} data-testid="edit-post">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    data-testid="delete-post"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none bg-background"
                rows={3}
                data-testid="edit-textarea"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleEdit} disabled={updatePost.isPending} data-testid="save-edit">
                  <Check className="mr-1 h-3 w-3" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(post.content); }}>
                  <X className="mr-1 h-3 w-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
          )}

          {post.media && post.media.length > 0 && (
            <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.media.map((m, i) => (
                <img
                  key={i}
                  src={m.url}
                  alt="Post media"
                  className="w-full object-cover rounded-lg max-h-64"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mt-3">
            <motion.button
              data-testid="like-button"
              className="flex items-center gap-2 text-muted-foreground hover:text-rose-500 transition-colors group"
              onClick={handleLike}
              animate={heartAnim ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-5 h-5 transition-all ${isLiked ? "fill-rose-500 text-rose-500" : "group-hover:text-rose-500"}`}
              />
              <span className="text-sm tabular-nums">{likesCount}</span>
            </motion.button>

            <button
              data-testid="comment-button"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm tabular-nums">{post.commentsCount}</span>
            </button>

            <button data-testid="share-button" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CommentSection postId={post.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              data-testid="confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full justify-start gap-2" onClick={() => toast({ title: "Shared to followers" })}>
              <Users className="w-4 h-4" />
              Share to followers
            </Button>
            <div className="flex gap-2">
              <Input readOnly value={`${window.location.origin}/profile/${post.author.id}`} />
              <Button variant="outline" onClick={copyLink} className="gap-2">
                <Link2 className="w-4 h-4" />
                Copy link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
