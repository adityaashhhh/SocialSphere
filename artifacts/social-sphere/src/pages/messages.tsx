import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { CheckCheck, Check, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetConversations,
  useGetConversationMessages,
  useSendMessage,
  getGetConversationsQueryKey,
  getGetConversationMessagesQueryKey,
  useGetFollowing,
  getGetFollowingQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string | null;
}

interface LastMessage {
  text: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: LastMessage;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  sender: Participant;
  text: string;
  readBy: string[];
  createdAt: string;
}

export default function MessagesPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showConvList, setShowConvList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sharedPostId = new URLSearchParams(location.split("?")[1] ?? "").get("share");

  const { data: conversationsData, isLoading: convsLoading } = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey() },
  });
  const { data: followingData } = useGetFollowing(user?.id ?? "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetFollowingQueryKey(user?.id ?? ""),
    },
  });

  const { data: messagesData, isLoading: msgsLoading } = useGetConversationMessages(
    selectedConvId ?? "",
    {
      query: {
        enabled: !!selectedConvId,
        queryKey: getGetConversationMessagesQueryKey(selectedConvId ?? ""),
      },
    },
  );

  const sendMessage = useSendMessage();

  const conversations = (conversationsData as any)?.conversations as Conversation[] | undefined;
  const messages = (messagesData as any)?.messages as Message[] | undefined;
  const following = followingData as Participant[] | undefined;
  const participants = conversations?.flatMap((conv) => conv.participants) ?? [];
  const visiblePeople = [...participants, ...(following ?? [])].reduce<Participant[]>((acc, person) => {
    if (!person || person.id === user?.id || acc.some((p) => p.id === person.id)) return acc;
    acc.push(person);
    return acc;
  }, []);

  const selectedConv = conversations?.find((c) => c.id === selectedConvId);
  const otherParticipant = selectedConv?.participants.find((p) => p.id !== user?.id);

  useEffect(() => {
    if (!socket || !selectedConvId) return;
    socket.emit("joinConversation", selectedConvId);
    return () => { socket.emit("leaveConversation", selectedConvId); };
  }, [socket, selectedConvId]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
      if (selectedConvId) {
        queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(selectedConvId) });
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => { socket.off("newMessage", handleNewMessage); };
  }, [socket, selectedConvId, queryClient]);

  useEffect(() => {
    if (!sharedPostId || !following?.length || selectedConvId) return;
    const first = following[0];
    if (!first) return;
    setSelectedConvId(first.id);
    setShowConvList(false);
    setLocation("/messages");
    setMessageText(`Check this out: ${window.location.origin}/post/${sharedPostId}`);
  }, [sharedPostId, following, selectedConvId, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId) return;
    const text = messageText;
    setMessageText("");
    sendMessage.mutate(
      { data: { recipientId: otherParticipant?.id ?? "", text } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(selectedConvId) });
        },
        onError: () => {
          setMessageText(text);
          toast({ title: "Failed to send message", variant: "destructive" });
        },
      },
    );
  };

  const getMessageStatus = (msg: Message) => {
    if (!user || msg.sender.id !== user.id) return null;
    const readCount = msg.readBy?.length ?? 0;
    const delivered = readCount > 0;
    const read = readCount > 1;
    return read ? <CheckCheck className="w-3.5 h-3.5 text-sky-500" /> : delivered ? <Check className="w-3.5 h-3.5 text-muted-foreground" /> : null;
  };

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    setShowConvList(false);
  };

  const ConversationList = () => (
    <div className={cn("flex flex-col border-r border-border h-full", showConvList ? "flex" : "hidden md:flex", "w-full md:w-80")}>
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        {convsLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : (conversations && conversations.length > 0) || visiblePeople.length > 0 ? (
          <div className="divide-y divide-border/50">
            {(conversations ?? []).map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id);
              const isSelected = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/10",
                  )}
                  onClick={() => handleSelectConv(conv.id)}
                  data-testid="conversation-item"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={other?.profilePicture ?? undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent font-semibold">
                      {(other?.displayName?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">{other?.displayName ?? other?.username}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.text}</p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            {visiblePeople
              .filter((person) => !(conversations ?? []).some((conv) => conv.participants.some((p) => p.id === person.id)))
              .map((person) => (
                <button
                  key={person.id}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => handleSelectConv(person.id)}
                  data-testid="conversation-item"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={person.profilePicture ?? undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent font-semibold">
                      {(person.displayName?.[0] ?? person.username?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{person.displayName ?? person.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{person.username}</p>
                  </div>
                </button>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const ChatPanel = () => (
    <div className={cn("flex flex-col flex-1 h-full", !showConvList || selectedConvId ? "flex" : "hidden md:flex")}>
      {selectedConvId && otherParticipant ? (
        <>
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-1"
              onClick={() => setShowConvList(true)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-9 h-9">
              <AvatarImage src={otherParticipant.profilePicture ?? undefined} />
              <AvatarFallback className="bg-accent/20 text-accent font-semibold">
                {(otherParticipant.displayName?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{otherParticipant.displayName}</p>
              <p className="text-xs text-muted-foreground">@{otherParticipant.username}</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {msgsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid="message-item">
                      {!isOwn && (
                        <Avatar className="w-7 h-7 mr-2 flex-shrink-0 self-end">
                          <AvatarImage src={msg.sender.profilePicture ?? undefined} />
                          <AvatarFallback className="text-xs">{(msg.sender.displayName?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("max-w-xs rounded-2xl px-4 py-2", isOwn ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <p className="text-sm break-words">{msg.text}</p>
                        <div className={cn("mt-0.5 flex items-center gap-1", isOwn ? "justify-end text-primary-foreground/70" : "text-muted-foreground")}>
                          <p className="text-xs">{timeAgo(msg.createdAt)}</p>
                          {getMessageStatus(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <MessageCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Start the conversation!</p>
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted/30"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                data-testid="message-input"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sendMessage.isPending || !messageText.trim()}
                data-testid="send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <div className="bg-muted rounded-full p-8 mb-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Your Messages</h2>
          <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex h-screen overflow-hidden">
        <ConversationList />
        <ChatPanel />
      </div>
    </Layout>
  );
}
