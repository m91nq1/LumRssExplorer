import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useSupabaseAuth } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
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
  const { isAuthenticated, isLoading } = useSupabaseAuth();

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
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      {isAuthenticated ? (
        <>
          <Route path="/home" component={Home} />
          <Route path="/article/:id" component={ArticleDetail} />
          <Route path="/settings" component={Settings} />
          <Route path="/feeds" component={FeedManagement} />
          <Route path="/profile" component={Profile} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/history" component={History} />
          <Route path="/search" component={SearchExplore} />
        </>
      ) : (
        <>
          <Route path="/home" component={Landing} />
          <Route path="/article/:id" component={Landing} />
          <Route path="/settings" component={Landing} />
          <Route path="/feeds" component={Landing} />
          <Route path="/profile" component={Landing} />
          <Route path="/bookmarks" component={Landing} />
          <Route path="/history" component={Landing} />
          <Route path="/search" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
