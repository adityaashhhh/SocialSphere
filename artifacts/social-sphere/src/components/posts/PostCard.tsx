import { useState, useEffect } from "react";
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
import { useSocket } from "@/lib/socket";
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
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    setCommentsCount(post.commentsCount);
  }, [post.commentsCount]);

  useEffect(() => {
    setLikesCount(post.likesCount);
    setIsLiked(post.isLiked);
  }, [post.likesCount, post.isLiked]);

  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetExplorePostsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.id) });
    queryClient.invalidateQueries({ queryKey: ["getPost", post.id] });
  };

  useEffect(() => {
    if (!socket || !post.id) return;
    socket.emit("joinPost", post.id);
    
    const handleNewComment = (data: any) => {
      if (data.postId === post.id) {
        setCommentsCount((prev) => prev + 1);
      }
    };

    socket.on("newComment", handleNewComment);
    return () => {
      socket.emit("leavePost", post.id);
      socket.off("newComment", handleNewComment);
    };
  }, [socket, post.id]);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    if (newLiked) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 400);
    }
    toggleLike.mutate(
      { postId: post.id } as any,
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
      { postId: post.id, data: { content: editContent } } as any,
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

  const shareToFollowers = () => {
    window.location.href = `/messages?share=${post.id}`;
  };

  const isOwn = user?.id === post.author.id;

  return (
    <article className="bg-card border-b border-border/50 p-6 hover:bg-primary/[0.02] transition-all duration-300 relative group" data-testid="post-card">
      <div className="flex gap-4">
        <Link href={`/profile/${post.author.id}`}>
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12 cursor-pointer ring-2 ring-background shadow-md">
              <AvatarImage src={post.author.profilePicture ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {(post.author.displayName?.[0] ?? post.author.username[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.author.id}`}>
                <span className="font-bold text-[15px] hover:text-primary transition-colors cursor-pointer tracking-tight">
                  {post.author.displayName || post.author.username}
                </span>
              </Link>
              <span className="text-muted-foreground text-xs font-medium">@{post.author.username}</span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="text-muted-foreground text-xs font-medium">{timeAgo(post.createdAt)}</span>
            </div>

            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 rounded-full" data-testid="post-menu">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10 rounded-2xl">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} data-testid="edit-post" className="rounded-xl">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive rounded-xl"
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
                className="w-full resize-none bg-muted/50 border-border/50 rounded-2xl p-4 focus:ring-primary/30"
                rows={3}
                data-testid="edit-textarea"
              />
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleEdit} disabled={updatePost.isPending} className="rounded-full px-4" data-testid="save-edit">
                  <Check className="mr-1 h-4 w-4" /> Save
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full px-4" onClick={() => { setIsEditing(false); setEditContent(post.content); }}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[15px] leading-[1.6] text-foreground/90 whitespace-pre-wrap break-words font-medium">
              {post.content}
            </p>
          )}

          {post.media && post.media.length > 0 && (
            <div className={`mt-4 grid gap-2 rounded-3xl overflow-hidden shadow-sm ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.media.map((m, i) => (
                <div key={i} className="aspect-square relative group/media overflow-hidden">
                  <img
                    src={m.url}
                    alt="Post media"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-8 mt-5">
            <motion.button
              data-testid="like-button"
              className={`flex items-center gap-2.5 transition-all group ${isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
              onClick={handleLike}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              animate={heartAnim ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-2 rounded-full transition-colors ${isLiked ? "bg-rose-500/10" : "group-hover:bg-rose-500/10"}`}>
                <Heart
                  className={`w-5 h-5 transition-all ${isLiked ? "fill-rose-500" : ""}`}
                />
              </div>
              <span className="text-sm font-bold tabular-nums tracking-tight">{likesCount}</span>
            </motion.button>

            <motion.button
              data-testid="comment-button"
              className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all group"
              onClick={() => setShowComments(!showComments)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold tabular-nums tracking-tight">{commentsCount}</span>
            </motion.button>

            <motion.button 
              data-testid="share-button" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group" 
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </motion.button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="overflow-hidden mt-4 pt-4 border-t border-border/50"
              >
                <CommentSection postId={post.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight">Delete post?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. Your post will be permanently removed from the sphere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl h-12 font-bold px-6"
              onClick={handleDelete}
              data-testid="confirm-delete"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="glass-card border-white/10 rounded-[2.5rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-center">Share this Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <Button className="w-full h-14 justify-center gap-3 rounded-2xl font-bold bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20" onClick={shareToFollowers}>
              <Users className="w-5 h-5" />
              Send to Followers
            </Button>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                <Link2 className="w-4 h-4" />
              </div>
              <Input 
                readOnly 
                value={`${window.location.origin}/profile/${post.author.id}`} 
                className="h-14 pl-12 bg-muted/50 border-border/50 rounded-2xl text-sm font-medium pr-24"
              />
              <Button 
                variant="primary" 
                size="sm" 
                onClick={copyLink} 
                className="absolute right-2 top-2 bottom-2 rounded-xl px-4 font-bold"
              >
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
