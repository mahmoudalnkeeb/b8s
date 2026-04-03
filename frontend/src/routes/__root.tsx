import { createRootRoute, Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { Toaster, toast } from 'sonner';
import {
  MessageSquare,
  LayoutGrid,
  Settings,
  LogOut,
  Compass,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  Wrench,
  Bot,
  ShieldCheck,
  Lightbulb,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useMyConversations, useDeleteConversation } from '../api/conversations';
import { usePinnedAgents } from '../api/agents';
import { useBillingBalance } from '../api/billing';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '../hooks/use-auth';
import { useTheme } from '../hooks/use-theme';
import { useState, useEffect } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { isAuthenticated, logout, user: authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && location.pathname) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const deleteConversation = useDeleteConversation();
  const { confirm } = useConfirm();

  const showSidebar =
    isAuthenticated && !['/', '/auth/login', '/auth/register'].includes(location.pathname);

  const { data: recentConversations } = useMyConversations({ enabled: showSidebar });
  const { data: pinnedAgents } = usePinnedAgents({ enabled: showSidebar });
  const { data: billingData } = useBillingBalance({ enabled: showSidebar });

  const handleLogout = () => {
    logout();
    navigate({ to: '/auth/login' });
  };

  const handlePinnedClick = (agentId: string) => {
    navigate({ to: '/chat/new/$agentId', params: { agentId } });
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const skipConfirm = localStorage.getItem('blueprints_skip_delete_confirm') === 'true';
    if (!skipConfirm) {
      const isConfirmed = await confirm({
        title: 'Delete Conversation',
        description: 'Are you sure you want to delete this chat? This action cannot be undone.',
        confirmText: 'Delete',
        destructive: true,
      });
      if (!isConfirmed) return;
    }
    try {
      await deleteConversation.mutateAsync(conversationId);
      toast.success('Conversation deleted');
      if (location.pathname.includes(conversationId)) navigate({ to: '/conversations/my' });
    } catch (err: any) {
      toast.error('Failed to delete conversation', { description: err.message });
      console.error('Delete failed', err);
    }
  };

  const navItemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors text-foreground/40 hover:text-foreground hover:bg-foreground/5 no-underline',
      isActive && 'text-primary-foreground bg-primary hover:bg-primary',
    );

  const navItems: Array<{ to: any; label: string; icon: any; isActive: boolean; isHighlight?: boolean }> = [
    { to: '/guide', label: 'How to Use', icon: BookOpen, isActive: location.pathname.startsWith('/guide') },
    { to: '/conversations/my', label: 'Chats', icon: MessageSquare, isActive: location.pathname.startsWith('/chat') || location.pathname === '/conversations/my' },
    { to: '/agents', label: 'Agents', icon: LayoutGrid, isActive: location.pathname.startsWith('/agents') },
    { to: '/discover', label: 'Discover', icon: Compass, isActive: location.pathname === '/discover' },
    { to: '/tools', label: 'Tools', icon: Wrench, isActive: location.pathname.startsWith('/tools') },
    { to: '/feedback', label: 'Feedback', icon: Lightbulb, isActive: location.pathname.startsWith('/feedback'), isHighlight: true },
  ];

  if (billingData?.role === 'admin') {
    navItems.push({ to: '/admin' as const, label: 'Admin', icon: ShieldCheck, isActive: location.pathname.startsWith('/admin') });
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground font-sans">
        {/* Skip to content link */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase">
          Skip to content
        </a>
        <Toaster theme={theme} position="bottom-right" richColors />
        {/* Mobile Overlay */}
        {showSidebar && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        {showSidebar && (
          <aside
            role="navigation"
            aria-label="Main navigation"
            className={cn(
              'flex flex-col border-r border-border bg-background transition-transform duration-300 z-50 shrink-0 h-full fixed md:relative',
              isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-16',
            )}
          >
            {/* Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                  className="absolute -right-3 top-10 z-50 bg-card border border-border p-1 hover:text-primary text-foreground/40 transition-colors hidden md:block"
                >
                  {isSidebarOpen ? (
                    <ChevronLeft className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                {isSidebarOpen ? 'Collapse' : 'Expand'}
              </TooltipContent>
            </Tooltip>

            <div
              className={cn(
                'p-4 flex items-center overflow-hidden',
                !isSidebarOpen && 'justify-center px-0',
              )}
            >
              <Link to="/" className="flex items-center gap-3 no-underline" aria-label="Blueprints home">
                <div className="bg-primary text-primary-foreground font-black font-sans text-sm tracking-tighter w-10 h-10 flex items-center justify-center shrink-0">
                  B8s
                </div>
                {isSidebarOpen && (
                  <>
                    <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
                      Blueprints
                    </span>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="ml-auto p-1.5 md:hidden text-foreground/40 hover:text-foreground"
                      aria-label="Close sidebar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </Link>
            </div>

            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto mt-4 overflow-x-hidden" aria-label="Dashboard navigation">
              {navItems.map(({ to, label, icon: Icon, isActive, isHighlight }) => (
                isSidebarOpen ? (
                  <Link
                    key={to}
                    to={to}
                    aria-label={label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      navItemClass(isActive),
                      isHighlight && !isActive && 'text-primary',
                      !isSidebarOpen && 'justify-center px-0',
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isHighlight && !isActive && "text-primary")} />
                    <span className="flex-1">{label}</span>
                    {isHighlight && (
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 ml-auto rounded font-bold tracking-widest uppercase">Beta</span>
                    )}
                  </Link>
                ) : (
                  <Tooltip key={to}>
                    <TooltipTrigger asChild>
                      <Link
                        to={to}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          navItemClass(isActive),
                          isHighlight && !isActive && 'text-primary',
                          'justify-center px-0',
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isHighlight && !isActive && "text-primary")} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                )
              ))}

              {isSidebarOpen && Array.isArray(pinnedAgents) && pinnedAgents.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border" role="group" aria-label="Pinned agents">
                  <p className="px-3 mb-3 font-mono text-[9px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <Pin className="h-3 w-3" /> Pinned — {pinnedAgents.length}
                  </p>
                  <div className="space-y-0.5">
                    {pinnedAgents.map((agent: any) => (
                      <button
                        key={agent.agentId}
                        onClick={() => handlePinnedClick(agent.agentId)}
                        aria-label={`Chat with ${agent.name}`}
                        className="flex items-center gap-3 px-3 py-2.5 w-full font-mono text-[10px] uppercase tracking-widest text-foreground/40 hover:text-foreground hover:bg-primary/10 transition-all bg-transparent border-none cursor-pointer text-left group/pin relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover/pin:opacity-100 transition-opacity" />
                        <div className="w-6 h-6 bg-primary/10 flex items-center justify-center shrink-0 group-hover/pin:bg-primary/20 transition-colors">
                          <Bot className="h-3 w-3 text-primary/60" />
                        </div>
                        <span className="truncate">{agent.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSidebarOpen && Array.isArray(recentConversations) && recentConversations.length > 0 && (
                <div className="mt-8" role="group" aria-label="Recent conversations">
                  <p className="px-3 mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-foreground/20">
                    Recents
                  </p>
                  <div className="space-y-0.5">
                    {recentConversations.slice(0, 15).map((conv: any) => (
                      <div key={conv.conversationId} className="group/item relative">
                        <Link
                          to="/chat/$conversationId"
                          params={{ conversationId: conv.conversationId }}
                          className="flex items-center gap-3 px-3 py-2 font-mono text-[10px] text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-colors no-underline truncate pr-8"
                          aria-label={`Resume chat: ${conv.agentName || 'Untitled Chat'}`}
                        >
                          <span className="truncate">
                            {conv.agentName || 'Untitled Chat'}
                          </span>
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv.conversationId)}
                              aria-label={`Delete conversation with ${conv.agentName || 'Untitled'}`}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-400 transition-all bg-transparent border-none cursor-pointer text-foreground/30"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Profile Section */}
            <div className="p-3 border-t border-border">
              <div
                className={cn(
                  'flex items-center gap-3 p-2 hover:bg-foreground/5 transition-colors',
                  !isSidebarOpen && 'justify-center px-0',
                )}
              >
                <div className="h-8 w-8 bg-primary flex items-center justify-center text-[10px] font-mono font-bold text-primary-foreground shrink-0 uppercase" aria-hidden="true">
                  {authUser?.name?.charAt(0) || 'U'}
                </div>
                {isSidebarOpen && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-foreground truncate">{authUser?.name || 'User'}</p>
                      <p className="font-mono text-[9px] text-foreground/30 uppercase tracking-widest">
                        {billingData?.tier === 'none' ? 'No Plan' : `${billingData?.tier || '—'} · ${((billingData?.cuBalance || 0) + (billingData?.grantedCuBalance || 0)).toFixed(2)} CU`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={toggleTheme}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            className="p-1 hover:text-primary text-foreground/30 transition-colors bg-transparent border-none cursor-pointer"
                          >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to="/settings"
                            aria-label="Settings"
                            className="p-1 hover:text-primary text-foreground/30 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleLogout}
                            aria-label="Log out"
                            className="p-1 hover:text-red-400 text-foreground/30 transition-colors bg-transparent border-none cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Log Out</TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}

        <main id="main-content" role="main" className="flex-1 flex flex-col overflow-hidden relative h-full">
          {showSidebar && (
            <div className="md:hidden flex items-center justify-between p-4 border-b border-border shrink-0 bg-background z-30">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="p-1.5 -ml-1.5 hover:bg-foreground/10 rounded-md transition-colors text-foreground/60 hover:text-foreground"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="bg-primary text-primary-foreground font-black font-sans text-sm tracking-tighter w-8 h-8 flex items-center justify-center shrink-0">
                  B8s
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors text-foreground/60 hover:text-foreground"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link to="/agents" className="px-3 py-1.5 bg-foreground/10 hover:bg-primary text-foreground hover:text-primary-foreground text-xs font-mono uppercase tracking-widest transition-colors border border-border hover:border-primary">
                  New Chat
                </Link>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto h-full w-full relative">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
