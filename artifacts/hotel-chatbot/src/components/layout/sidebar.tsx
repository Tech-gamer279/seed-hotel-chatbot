import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, X, Menu, Hotel, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { LuxuryButton } from "@/components/ui/luxury-button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();


  const { data, isLoading } = useListOpenaiConversations();
  const conversations = Array.isArray(data) ? data : [];
  const { mutate: createConv, isPending: isCreating } = useCreateOpenaiConversation();
  const { mutate: deleteConv } = useDeleteOpenaiConversation();

  const handleCreate = () => {
    createConv(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setLocation(`/c/${newConv.id}`);
          setIsOpen(false);
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConv(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (location === `/c/${id}`) {
            setLocation("/");
          }
        }
      }
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 flex flex-col gap-4">
        <Link href="/" onClick={() => setIsOpen(false)}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
              <Hotel className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg leading-none text-gradient-brand">Seed Hotel</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Concierge</span>
            </div>
          </div>
        </Link>

        <LuxuryButton 
          className="w-full justify-start gap-2" 
          onClick={handleCreate}
          isLoading={isCreating}
          variant="secondary"
        >
          <Plus className="w-4 h-4" />
          Start New Request
        </LuxuryButton>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="text-[11px] font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-widest">
          Recent Requests
        </div>
        
        <div className="space-y-0.5">
          {isLoading ? (
            <div className="px-2 py-3 text-sm text-muted-foreground animate-pulse">Loading history...</div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center border border-dashed border-border rounded-lg">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = location === `/c/${conv.id}`;
              return (
                <Link key={conv.id} href={`/c/${conv.id}`} onClick={() => setIsOpen(false)}>
                  <div className={cn(
                    "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="text-sm truncate font-medium">
                          {conv.title}
                        </span>
                        <span className="text-[10px] opacity-60 mt-0.5">
                          {format(new Date(conv.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-md transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* User profile footer */}
      {user && (
        <div className="shrink-0 px-3 py-3 border-t border-border/50">
          <div className="flex items-center gap-2.5">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email ?? "Guest"}
              </p>
              {user.email && (
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Header & Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 glass-panel border-b border-border/50 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Hotel className="w-5 h-5 text-primary" />
          <h1 className="font-display font-semibold text-lg text-gradient-brand">Seed Hotel</h1>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen shrink-0 relative z-10">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] z-50 shadow-2xl"
            >
              <SidebarContent />
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-primary bg-background/50 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
