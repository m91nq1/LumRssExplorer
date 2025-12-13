import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import About from "@/pages/About";
import FeedManagement from "@/pages/FeedManagement";
import ArticleDetail from "@/pages/ArticleDetail";
import SearchExplore from "@/pages/SearchExplore";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Bookmarks from "@/pages/Bookmarks";
import History from "@/pages/History";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/about" component={About} />
      <Route path="/home" component={Home} />
      <Route path="/article/:id" component={ArticleDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/feeds" component={FeedManagement} />
      <Route path="/profile" component={Profile} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/history" component={History} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      {isAuthenticated && (
        <>
          <Route path="/search" component={SearchExplore} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
