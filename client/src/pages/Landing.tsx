import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Newspaper, Layers, Bell, TrendingUp, Sparkles, Zap } from "lucide-react";

const GlobeCanvas = lazy(() => import("@/components/GlobeCanvas"));

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)" }}
        />
        <div 
          className="absolute top-1/4 right-0 w-[400px] h-[400px] blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)" }}
        />
      </div>

      <header className="relative z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight">LUM News</span>
          </div>
          <a href="/api/login">
            <Button 
              variant="outline" 
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </a>
        </div>
      </header>

      <main className="relative">
        <section 
          className="min-h-[calc(100vh-80px)] flex items-center py-16 px-6 md:px-12 lg:px-16"
        >
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                    News Intelligence · Beta
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
                  The world's narratives{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent font-normal">
                    in your hands
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
                  Multi-region news intelligence with story clustering, AI-powered summaries, 
                  and customizable lenses. Stay informed with curated content from 50+ global sources.
                </p>

                <div className="flex flex-wrap gap-4">
                  <a href="/api/login">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 px-8"
                      data-testid="button-launch-dashboard"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Launch Dashboard
                    </Button>
                  </a>
                  <a href="/home">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10 text-white px-8"
                      data-testid="button-explore-stories"
                    >
                      Explore Stories
                    </Button>
                  </a>
                </div>

                <p className="text-sm text-gray-500">
                  Powered by global sources & AI summaries
                </p>
              </div>

              <div className="relative animate-fadeIn animation-delay-300">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl" />
                <div className="relative bg-[#050816]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden">
                  <div className="aspect-square md:aspect-[4/3] lg:aspect-square">
                    <Suspense fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                    }>
                      <GlobeCanvas />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 md:px-12 lg:px-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div 
                className="group relative bg-[#050816]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-indigo-500/30 hover-elevate animate-fadeIn animation-delay-500"
                data-testid="card-top-stories"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Top Stories</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Curated headlines from trusted global sources, updated every 10 minutes.
                  </p>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/5 rounded-full w-full" />
                    <div className="h-2 bg-white/5 rounded-full w-4/5" />
                    <div className="h-2 bg-white/5 rounded-full w-3/5" />
                  </div>
                </div>
              </div>

              <div 
                className="group relative bg-[#050816]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-purple-500/30 hover-elevate animate-fadeIn animation-delay-600"
                data-testid="card-lenses"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                    <Layers className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Lenses</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Filter news by topic, region, or sentiment with customizable views.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-300">Tech</span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300">Finance</span>
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-300">Science</span>
                  </div>
                </div>
              </div>

              <div 
                className="group relative bg-[#050816]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-blue-500/30 hover-elevate animate-fadeIn animation-delay-700"
                data-testid="card-alerts"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Bell className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Alerts & Digests</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Get notified on breaking stories and receive daily AI-powered summaries.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Real-time monitoring active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 md:px-12 lg:px-16 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-light mb-4">
              Ready to explore the world's stories?
            </h2>
            <p className="text-gray-400 mb-8">
              Sign in to unlock personalized feeds, bookmarks, and AI-powered insights.
            </p>
            <a href="/api/login">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 px-10"
                data-testid="button-cta-login"
              >
                Get Started Free
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/5 py-8 px-6 text-center">
        <p className="text-sm text-gray-500">
          LUM News — The world's narratives in your hands
        </p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
