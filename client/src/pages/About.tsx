import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Newspaper, 
  Globe, 
  Brain, 
  BarChart3, 
  Star, 
  Search, 
  Target,
  Shield,
  ChevronRight,
  TrendingUp,
  FileText,
  Compass,
  Satellite,
  ArrowRight
} from "lucide-react";
import cosmicLibraryBg from "@assets/cosmic-library-bg.jpg";

export default function About() {
  return (
    <div 
      className="min-h-screen text-white"
      style={{
        backgroundImage: `url(${cosmicLibraryBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl tracking-tight">LUM News</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/home">
              <Button 
                variant="ghost" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                data-testid="nav-explore"
              >
                Explore
              </Button>
            </Link>
            <a href="/api/login">
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </a>
          </nav>
        </div>
      </header>

      <main className="relative pt-24">
        <section className="py-20 px-6 relative z-10">
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-sm text-indigo-300 mb-6">
              <Satellite className="w-4 h-4" />
              <span>News Intelligence</span>
              <span className="text-indigo-500">·</span>
              <span>Multi-Region</span>
              <span className="text-indigo-500">·</span>
              <span>AI-Summarised</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight" data-testid="heading-about">
                About <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-normal">LUM News</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed" data-testid="text-subtitle">
              An AI-powered global news lens that helps you see how the world is telling the same story.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-light mb-6" data-testid="heading-what-we-do">What LUM News Does</h2>
                <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                  <p>
                    LUM News <strong className="text-white">aggregates news</strong> from dozens of sources across multiple regions, giving you a comprehensive view of global events.
                  </p>
                  <p>
                    It <strong className="text-white">clusters related articles into stories</strong> so you see the event, not just random headlines scattered across publications.
                  </p>
                  <p>
                    Using <strong className="text-white">AI to summarise and compare coverage</strong>, LUM helps you understand sentiment and bias across different outlets and regions.
                  </p>
                  <p>
                    You can <strong className="text-white">filter by topics and regions</strong>—war, AI, European politics, and more—and save the stories that matter to you.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-blue-500/30 transition-all duration-300 hover-elevate" data-testid="feature-global-perspective">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-3 border border-blue-500/20">
                    <Satellite className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-medium mb-1">Global Perspective</h3>
                  <p className="text-sm text-gray-400">See stories from US, Europe, China, Russia and more in one place.</p>
                </div>
                
                <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-purple-500/30 transition-all duration-300 hover-elevate" data-testid="feature-ai-summaries">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-3 border border-purple-500/20">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-medium mb-1">AI Summaries</h3>
                  <p className="text-sm text-gray-400">Get fast, neutral summaries of complex stories.</p>
                </div>
                
                <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-cyan-500/30 transition-all duration-300 hover-elevate" data-testid="feature-coverage-sentiment">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-3 border border-cyan-500/20">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-medium mb-1">Coverage & Sentiment</h3>
                  <p className="text-sm text-gray-400">Understand who is covering what, and how they frame it.</p>
                </div>
                
                <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-amber-500/30 transition-all duration-300 hover-elevate" data-testid="feature-saved-stories">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-3 border border-amber-500/20">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-medium mb-1">Saved Stories</h3>
                  <p className="text-sm text-gray-400">Bookmark the narratives you want to follow.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-light text-center mb-12" data-testid="heading-why-use">Why Use LUM News?</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 hover-elevate" data-testid="card-every-side">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Globe className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">See Every Side of the Story</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Different outlets and regions cover the same event in remarkably different ways. LUM shows you all perspectives side by side.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 hover-elevate" data-testid="card-cut-overload">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                    <Search className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Cut Through Information Overload</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Story clustering and AI summaries help you understand complex events in seconds, not hours of reading.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 hover-elevate" data-testid="card-track-topics">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-amber-500/20">
                    <Star className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Track Topics That Matter</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Set up personalised alerts and digests for the topics and regions you care about most.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 hover-elevate" data-testid="card-intelligence">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20">
                    <BarChart3 className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Turn News Into Intelligence</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Built for people who need to understand patterns and trends, not just read headlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-light text-center mb-12" data-testid="heading-who-for">Who Is LUM News For?</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 text-center hover:border-indigo-500/30 transition-all duration-300 hover-elevate" data-testid="persona-analysts">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                  <TrendingUp className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium mb-3">Analysts & Researchers</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Geopolitical analysts, risk teams, and policy researchers who need multi-source views to inform critical decisions.
                </p>
              </div>
              
              <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 text-center hover:border-blue-500/30 transition-all duration-300 hover-elevate" data-testid="persona-journalists">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium mb-3">Journalists & Editors</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Reporters who want to discover emerging and under-reported stories across regions before they go mainstream.
                </p>
              </div>
              
              <div className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 text-center hover:border-teal-500/30 transition-all duration-300 hover-elevate" data-testid="persona-readers">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Compass className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-medium mb-3">Curious Power Readers</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Informed individuals who want more than a single feed or echo chamber—people who value understanding over reaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-light text-center mb-12" data-testid="heading-how-works">How LUM News Works</h2>
            
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent -translate-y-1/2" />
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="relative text-center" data-testid="step-collect">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <Globe className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-8 right-0 hidden md:flex items-center text-indigo-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">1. Collect</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    We aggregate stories from multiple global sources and regions in real-time.
                  </p>
                </div>
                
                <div className="relative text-center" data-testid="step-analyse">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-8 right-0 hidden md:flex items-center text-indigo-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">2. Cluster & Analyse</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    AI groups related articles into stories, extracting entities, sentiment, and coverage patterns.
                  </p>
                </div>
                
                <div className="relative text-center" data-testid="step-present">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">3. Present & Personalise</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    You explore via topics, regions, and lenses, saving the narratives that matter to you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-3xl">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-8" data-testid="section-trust">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-500/20">
                  <Shield className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light mb-4" data-testid="heading-trust">Built for Clarity, Not Clickbait</h2>
                  <div className="space-y-3 text-gray-400 leading-relaxed" data-testid="text-trust-content">
                    <p data-testid="text-trust-sources">
                      We show multiple sources side-by-side, so you can compare coverage and form your own conclusions.
                    </p>
                    <p data-testid="text-trust-neutral">
                      AI summaries aim to be neutral and transparent, highlighting key facts without editorial spin.
                    </p>
                    <p data-testid="text-trust-original">
                      You can always click through to the <strong className="text-white">original articles</strong>—we believe in transparency and attribution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 relative z-10">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-4" data-testid="heading-cta">
              Ready to See the World's Narratives Differently?
            </h2>
            <p className="text-lg text-gray-400 mb-8" data-testid="text-cta-body">
              Join thousands of informed readers who trust LUM News for their daily intelligence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/home">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
                  data-testid="button-explore-lum"
                >
                  Explore LUM News
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/30 bg-black/40 hover:bg-white/10 text-white px-8 backdrop-blur-sm"
                  data-testid="button-back-home"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="py-8 px-6 border-t border-white/5 relative z-10">
          <div className="container mx-auto max-w-5xl text-center text-sm text-gray-500">
            <p>LUM News — Global News Intelligence</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
