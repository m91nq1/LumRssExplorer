import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Globe, Bookmark, Search, Star, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">LUM News</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Sign In</Button>
          </a>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Your Personal News Aggregator
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stay informed with curated news from top sources worldwide. 
              Bookmark articles, track what you've read, and personalize your feed.
            </p>
            <a href="/api/login">
              <Button size="lg" data-testid="button-get-started">
                Get Started
              </Button>
            </a>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-12">
              Why Choose LUM News?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Globe className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>10+ Global Sources</CardTitle>
                  <CardDescription>
                    Access news from BBC, CNN, NYT, The Guardian, and more trusted sources.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Bookmark className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Save & Track</CardTitle>
                  <CardDescription>
                    Bookmark articles for later and track what you've already read.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Search className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Smart Search</CardTitle>
                  <CardDescription>
                    Find articles with intelligent search and filter by source or time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Star className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Personalized</CardTitle>
                  <CardDescription>
                    Set your favorite sources and default filters for a tailored experience.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Always Fresh</CardTitle>
                  <CardDescription>
                    News feeds refresh automatically every 10 minutes to keep you updated.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Newspaper className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Clean Reading</CardTitle>
                  <CardDescription>
                    Enjoy a distraction-free reading experience with our modern interface.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Sign in with your Replit account to access all features.
            </p>
            <a href="/api/login">
              <Button size="lg" data-testid="button-cta-login">
                Sign In Now
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>LUM News - Aggregating world news for you</p>
      </footer>
    </div>
  );
}
