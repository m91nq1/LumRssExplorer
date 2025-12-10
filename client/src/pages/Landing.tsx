import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Newspaper, Layers, Bell, TrendingUp, Zap } from "lucide-react";

const HorizonGlobe = lazy(() => import("@/components/HorizonGlobe"));

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-sm">
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
        <section className="hero relative h-[75vh] min-h-[600px] overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 120% 60% at 50% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 100% 40% at 50% 110%, rgba(99, 102, 241, 0.2) 0%, transparent 40%),
                linear-gradient(to bottom, #020617 0%, #0a0a1a 50%, #020617 100%)
              `,
            }}
          />

          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 20px 30px, white, transparent),
                radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 90px 40px, white, transparent),
                radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.5), transparent),
                radial-gradient(2px 2px at 200px 50px, white, transparent),
                radial-gradient(1px 1px at 240px 90px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 280px 140px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 320px 30px, white, transparent),
                radial-gradient(1px 1px at 360px 70px, rgba(255,255,255,0.7), transparent),
                radial-gradient(2px 2px at 400px 100px, rgba(255,255,255,0.9), transparent),
                radial-gradient(1px 1px at 440px 50px, white, transparent),
                radial-gradient(1px 1px at 480px 110px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 520px 80px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 560px 130px, white, transparent),
                radial-gradient(2px 2px at 600px 40px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 640px 90px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 680px 60px, white, transparent),
                radial-gradient(1px 1px at 720px 120px, rgba(255,255,255,0.8), transparent),
                radial-gradient(1px 1px at 760px 45px, rgba(255,255,255,0.6), transparent),
                radial-gradient(2px 2px at 800px 75px, white, transparent),
                radial-gradient(1px 1px at 840px 105px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 880px 35px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 920px 95px, white, transparent),
                radial-gradient(1px 1px at 960px 55px, rgba(255,255,255,0.8), transparent),
                radial-gradient(2px 2px at 1000px 85px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 1040px 115px, white, transparent),
                radial-gradient(1px 1px at 1080px 25px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 1120px 65px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 1160px 135px, white, transparent)
              `,
              backgroundSize: '1200px 150px',
              backgroundRepeat: 'repeat',
            }}
          />

          <div className="hero-overlay absolute inset-0 z-10 flex flex-col items-center justify-start pt-32 px-6 pointer-events-none">
            <div className="hero-heading text-center max-w-3xl animate-fadeIn pointer-events-auto">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium tracking-widest uppercase">
                  LUM News
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6">
                The world's narratives{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent font-normal">
                  in your hands
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
                Discover real-time stories and perspectives from every corner of the globe in one powerful dashboard.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
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
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white px-8 backdrop-blur-sm"
                    data-testid="button-explore-stories"
                  >
                    Explore Stories
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div 
            id="hero-globe-container" 
            className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-auto"
          >
            <Suspense fallback={
              <div className="w-full h-full flex items-end justify-center">
                <div className="w-32 h-32 mb-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            }>
              <HorizonGlobe className="w-full h-full" />
            </Suspense>
          </div>

          <div 
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.8) 50%, transparent 100%)',
            }}
          />
        </section>

        <section className="py-20 px-6 md:px-12 lg:px-16 relative z-10">
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

        <section className="py-16 px-6 md:px-12 lg:px-16 text-center relative z-10">
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

      <footer className="relative border-t border-white/5 py-8 px-6 text-center z-10">
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
