import { Bell, Heart, MessageCircle, UserPlus, Trash2, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type NotificationType = "like" | "comment" | "follow" | "mention";

interface Notification {
  id: string;
  type: NotificationType;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    profilePicture?: string | null;
  };
  postId?: string;
  read: boolean;
  createdAt: string;
}

const notificationIcon = {
  like: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
  comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  follow: <UserPlus className="w-4 h-4 text-green-500" />,
  mention: <Bell className="w-4 h-4 text-accent" />,
};

const notificationText = (type: NotificationType) => {
  switch (type) {
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "follow": return "started following you";
    case "mention": return "mentioned you";
    default: return "interacted with you";
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetNotifications({
    query: { queryKey: getGetNotificationsQueryKey() },
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = (data as any)?.notifications as Notification[] | undefined;
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined as any, {
      onSuccess: () => {
        invalidate();
        toast({ title: "All notifications marked as read" });
      },
    });
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate({ pathParams: { notificationId: id } } as any, {
      onSuccess: invalidate,
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate({ pathParams: { notificationId: id } } as any, {
      onSuccess: () => {
        invalidate();
        toast({ title: "Notification deleted" });
      },
    });
  };

  return (
    <Layout>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="gap-2 text-sm"
            data-testid="mark-all-read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              data-testid="notification-item"
              className={cn(
                "flex items-center gap-3 p-4 group transition-colors",
                !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
              )}
              onClick={() => !n.read && handleMarkRead(n.id)}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={n.sender?.profilePicture ?? undefined} />
                  <AvatarFallback className="bg-muted">
                    {(n.sender?.displayName?.[0] ?? "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  {notificationIcon[n.type]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {n.sender ? (
                    <Link href={`/profile/${n.sender.id}`}>
                      <span className="font-semibold hover:underline cursor-pointer">
                        {n.sender.displayName}
                      </span>
                    </Link>
                  ) : (
                    <span className="font-semibold">Someone</span>
                  )}{" "}
                  {notificationText(n.type)}
                  {n.postId && (
                    <>
                      {" "}
                      <span className="text-muted-foreground">· </span>
                      <span className="text-muted-foreground text-xs">view post</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" data-testid="unread-dot" />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                data-testid="delete-notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="bg-muted rounded-full p-6 mb-4">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">All caught up</h2>
          <p className="text-muted-foreground text-sm">No notifications yet. Start connecting with people!</p>
        </div>
      )}
    </Layout>
  );
}
