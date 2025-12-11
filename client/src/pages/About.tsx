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
      className="min-h-screen text-gray-900"
      style={{
        backgroundImage: `url(${cosmicLibraryBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-white/85 pointer-events-none" />
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl tracking-tight text-gray-900">LUM News</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/home">
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                data-testid="nav-explore"
              >
                Explore
              </Button>
            </Link>
            <a href="/api/login">
              <Button 
                variant="outline" 
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full text-sm text-indigo-700 mb-6">
              <Satellite className="w-4 h-4" />
              <span>News Intelligence</span>
              <span className="text-indigo-400">·</span>
              <span>Multi-Region</span>
              <span className="text-indigo-400">·</span>
              <span>AI-Summarised</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-gray-900" data-testid="heading-about">
                About <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-normal">LUM News</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed" data-testid="text-subtitle">
              An AI-powered global news lens that helps you see how the world is telling the same story.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-light mb-6 text-gray-900" data-testid="heading-what-we-do">What LUM News Does</h2>
                <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                  <p>
                    LUM News <strong className="text-gray-900">aggregates news</strong> from dozens of sources across multiple regions, giving you a comprehensive view of global events.
                  </p>
                  <p>
                    It <strong className="text-gray-900">clusters related articles into stories</strong> so you see the event, not just random headlines scattered across publications.
                  </p>
                  <p>
                    Using <strong className="text-gray-900">AI to summarise and compare coverage</strong>, LUM helps you understand sentiment and bias across different outlets and regions.
                  </p>
                  <p>
                    You can <strong className="text-gray-900">filter by topics and regions</strong>—war, AI, European politics, and more—and save the stories that matter to you.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300" data-testid="feature-global-perspective">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mb-3 border border-blue-200">
                    <Satellite className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-1 text-gray-900">Global Perspective</h3>
                  <p className="text-sm text-gray-500">See stories from US, Europe, China, Russia and more in one place.</p>
                </div>
                
                <div className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-lg transition-all duration-300" data-testid="feature-ai-summaries">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-3 border border-purple-200">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-1 text-gray-900">AI Summaries</h3>
                  <p className="text-sm text-gray-500">Get fast, neutral summaries of complex stories.</p>
                </div>
                
                <div className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-cyan-300 hover:shadow-lg transition-all duration-300" data-testid="feature-coverage-sentiment">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mb-3 border border-cyan-200">
                    <BarChart3 className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h3 className="font-medium mb-1 text-gray-900">Coverage & Sentiment</h3>
                  <p className="text-sm text-gray-500">Understand who is covering what, and how they frame it.</p>
                </div>
                
                <div className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-lg transition-all duration-300" data-testid="feature-saved-stories">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mb-3 border border-amber-200">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-medium mb-1 text-gray-900">Saved Stories</h3>
                  <p className="text-sm text-gray-500">Bookmark the narratives you want to follow.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-light text-center mb-12 text-gray-900" data-testid="heading-why-use">Why Use LUM News?</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-gray-50 rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:border-blue-300 hover:shadow-lg" data-testid="card-every-side">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4 border border-blue-200">
                  <Globe className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900">See Every Side of the Story</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Different outlets and regions cover the same event in remarkably different ways. LUM shows you all perspectives side by side.
                </p>
              </div>
              
              <div className="group relative bg-gray-50 rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:border-purple-300 hover:shadow-lg" data-testid="card-cut-overload">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4 border border-purple-200">
                  <Search className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900">Cut Through Information Overload</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Story clustering and AI summaries help you understand complex events in seconds, not hours of reading.
                </p>
              </div>
              
              <div className="group relative bg-gray-50 rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:border-amber-300 hover:shadow-lg" data-testid="card-track-topics">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
                  <Star className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900">Track Topics That Matter</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Set up personalised alerts and digests for the topics and regions you care about most.
                </p>
              </div>
              
              <div className="group relative bg-gray-50 rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-lg" data-testid="card-intelligence">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mb-4 border border-cyan-200">
                  <BarChart3 className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900">Turn News Into Intelligence</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Built for people who need to understand patterns and trends, not just read headlines.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-light text-center mb-12 text-gray-900" data-testid="heading-who-for">Who Is LUM News For?</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-white rounded-2xl border border-gray-200 p-6 text-center hover:border-indigo-300 hover:shadow-lg transition-all duration-300" data-testid="persona-analysts">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 border border-indigo-200">
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900">Analysts & Researchers</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Geopolitical analysts, risk teams, and policy researchers who need multi-source views to inform critical decisions.
                </p>
              </div>
              
              <div className="group bg-white rounded-2xl border border-gray-200 p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300" data-testid="persona-journalists">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4 border border-blue-200">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900">Journalists & Editors</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Reporters who want to discover emerging and under-reported stories across regions before they go mainstream.
                </p>
              </div>
              
              <div className="group bg-white rounded-2xl border border-gray-200 p-6 text-center hover:border-teal-300 hover:shadow-lg transition-all duration-300" data-testid="persona-readers">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-100 to-green-100 rounded-2xl flex items-center justify-center mb-4 border border-teal-200">
                  <Compass className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900">Curious Power Readers</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Informed individuals who want more than a single feed or echo chamber—people who value understanding over reaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10 bg-white">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-light text-center mb-12 text-gray-900" data-testid="heading-how-works">How LUM News Works</h2>
            
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-200 to-transparent -translate-y-1/2" />
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="relative text-center" data-testid="step-collect">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <Globe className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-8 right-0 hidden md:flex items-center text-indigo-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">1. Collect</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We aggregate stories from multiple global sources and regions in real-time.
                  </p>
                </div>
                
                <div className="relative text-center" data-testid="step-analyse">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-8 right-0 hidden md:flex items-center text-indigo-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">2. Cluster & Analyse</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    AI groups related articles into stories, extracting entities, sentiment, and coverage patterns.
                  </p>
                </div>
                
                <div className="relative text-center" data-testid="step-present">
                  <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">3. Present & Personalise</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    You explore via topics, regions, and lenses, saving the narratives that matter to you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 relative z-10">
          <div className="container mx-auto max-w-3xl">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm" data-testid="section-trust">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-200">
                  <Shield className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-light mb-4 text-gray-900" data-testid="heading-trust">Built for Clarity, Not Clickbait</h2>
                  <div className="space-y-3 text-gray-500 leading-relaxed" data-testid="text-trust-content">
                    <p data-testid="text-trust-sources">
                      We show multiple sources side-by-side, so you can compare coverage and form your own conclusions.
                    </p>
                    <p data-testid="text-trust-neutral">
                      AI summaries aim to be neutral and transparent, highlighting key facts without editorial spin.
                    </p>
                    <p data-testid="text-trust-original">
                      You can always click through to the <strong className="text-gray-900">original articles</strong>—we believe in transparency and attribution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 relative z-10 bg-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-gray-900" data-testid="heading-cta">
              Ready to See the World's Narratives Differently?
            </h2>
            <p className="text-lg text-gray-500 mb-8" data-testid="text-cta-body">
              Join thousands of informed readers who trust LUM News for their daily intelligence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/home">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 px-8"
                  data-testid="button-explore-lum"
                >
                  Explore LUM News
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                  data-testid="button-back-home"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="py-8 px-6 border-t border-gray-200 relative z-10 bg-gray-50">
          <div className="container mx-auto max-w-5xl text-center text-sm text-gray-500">
            <p>LUM News — Global News Intelligence</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
