import { useState } from "react";
import { Heart, Reply, Send, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Comment,
  useGetComments,
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
  useReplyToComment,
  getGetCommentsQueryKey,
  getGetFeedQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/time";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
}

function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const toggleLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();
  const replyToComment = useReplyToComment();

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    toggleLike.mutate(
      { commentId: comment.id },
      {
        onError: () => {
          setIsLiked(!newLiked);
          setLikesCount((c) => (newLiked ? c - 1 : c + 1));
        },
      },
    );
  };

  const handleDelete = () => {
    deleteComment.mutate(
      { commentId: comment.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId) });
          toast({ title: "Comment deleted" });
        },
      },
    );
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyToComment.mutate(
      { commentId: comment.id, data: { text: replyText } },
      {
        onSuccess: () => {
          setReplyText("");
          setShowReply(false);
          queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId) });
        },
        onError: () => toast({ title: "Failed to reply", variant: "destructive" }),
      },
    );
  };

  return (
    <div className={`flex gap-2 ${depth > 0 ? "ml-8 mt-2" : "mt-3"}`} data-testid="comment-item">
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={comment.author.profilePicture ?? undefined} />
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {(comment.author.displayName?.[0] ?? comment.author.username[0]).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/40 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{comment.author.displayName || comment.author.username}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm mt-0.5 break-words">{comment.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2">
          <button
            data-testid="comment-like"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
            onClick={handleLike}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          {depth === 0 && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setShowReply(!showReply)}
              data-testid="reply-button"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {user?.id === comment.author.id && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showReply && (
          <div className="flex gap-2 mt-2 ml-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              data-testid="reply-input"
            />
            <Button
              size="sm"
              onClick={handleReply}
              disabled={replyToComment.isPending || !replyText.trim()}
              className="h-8 px-2"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments, isLoading } = useGetComments(postId, {
    query: { queryKey: getGetCommentsQueryKey(postId) },
  });

  const createComment = useCreateComment();

  const handleSubmit = () => {
    if (!text.trim() || !user) return;
    createComment.mutate(
      { postId, data: { text } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId) });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        },
        onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50" data-testid="comment-section">
      {user && (
        <div className="flex gap-2 items-center">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage src={user.profilePicture ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {(user.displayName?.[0] ?? user.username[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="h-9 text-sm bg-muted/30"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              data-testid="comment-input"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createComment.isPending || !text.trim()}
              className="h-9 px-3"
              data-testid="comment-submit"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 mt-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
              <Skeleton className="h-14 flex-1 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {(comments as Comment[] | undefined)?.map((c) => (
            <CommentItem key={c.id} comment={c} postId={postId} />
          ))}
          {(comments as Comment[] | undefined)?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-3">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}
