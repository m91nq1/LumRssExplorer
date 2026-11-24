import { Link } from "wouter";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Bell, TrendingUp, Zap, Lock, Play, Volume2, VolumeX } from "lucide-react";
import heroBackground from "@assets/image_1766075796395.png";
import lumLogo from "@/assets/lum-logo.png";
import demoVideo from "@assets/LUMnew1221_1766340637581.mp4";

export default function Landing() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setShowPlayButton(false);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    ) : null;

    observer?.observe(container);
    return () => {
      observer?.disconnect();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div 
      className="min-h-screen text-white overflow-hidden"
      style={{
        backgroundColor: '#020b0e',
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        backgroundAttachment: 'fixed',
        imageRendering: 'auto',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 pointer-events-none" />
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={lumLogo} 
              alt="LUM News Logo" 
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="font-semibold text-xl tracking-tight">LUM News</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/about">
              <Button 
                variant="ghost" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                data-testid="nav-about"
              >
                About
              </Button>
            </a>
            <Link href="/login">
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="hero relative h-screen min-h-[700px] overflow-hidden">

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="text-center max-w-4xl px-6 animate-fadeIn">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4">
                <span className="text-white">LUM</span>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-normal"> News</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 tracking-widest uppercase mb-8">
                The world's narratives in your hands
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/signup">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
                    data-testid="button-launch-dashboard"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Launch Dashboard
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/30 bg-black/40 hover:bg-white/10 text-white px-8 backdrop-blur-sm"
                    data-testid="button-explore-stories"
                  >
                    Explore Stories
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 md:px-12 lg:px-16 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left animate-fadeIn animation-delay-300">
                <h2 className="text-3xl md:text-4xl font-light mb-4">
                  See LUM News in action
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                  A quick walkthrough of the globe, lenses, and alerts.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
                      data-testid="button-get-started-demo"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/30 bg-black/40 hover:bg-white/10 text-white px-8 backdrop-blur-sm"
                      data-testid="button-explore-demo"
                    >
                      Explore Stories
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  No credit card required.
                </p>
              </div>

              <div 
                ref={videoContainerRef}
                className="relative group animate-fadeIn animation-delay-500"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/40 via-purple-600/40 to-indigo-600/40 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-violet-500/30 overflow-hidden shadow-2xl shadow-violet-500/10">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/90 border-b border-white/5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-xs text-gray-500">LUM News Demo</span>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={() => !isMobile && setShowControls(true)}
                    onMouseLeave={() => !isMobile && setShowControls(false)}
                  >
                    <video
                      ref={videoRef}
                      src={demoVideo}
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      controls={isMobile || showControls}
                      data-testid="video-demo"
                    />
                    {showPlayButton && (
                      <button
                        onClick={handlePlayClick}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                        data-testid="button-play-video"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </div>
                      </button>
                    )}
                    <button
                      onClick={toggleMute}
                      className={`absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-opacity z-10 ${isMobile ? 'opacity-100' : showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      data-testid="button-mute-toggle"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 md:px-12 lg:px-16 relative z-10">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div 
                className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-blue-500/30 hover-elevate animate-fadeIn animation-delay-500"
                data-testid="card-top-stories"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Top Stories</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Curated headlines from trusted global sources, updated every 10 minutes.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock className="w-3 h-3" />
                    Sign in to view stories
                  </div>
                </div>
              </div>

              <div 
                className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-cyan-500/30 hover-elevate animate-fadeIn animation-delay-600"
                data-testid="card-lenses"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20">
                    <Layers className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Lenses</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Filter news by topic, region, or sentiment with customizable views.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-300">Tech</span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300">Finance</span>
                    <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs text-teal-300">Science</span>
                  </div>
                </div>
              </div>

              <div 
                className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 transition-colors duration-300 hover:border-indigo-500/30 hover-elevate animate-fadeIn animation-delay-700"
                data-testid="card-alerts"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                    <Bell className="w-6 h-6 text-indigo-400" />
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
            <Link href="/signup">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-blue-500/25 px-10"
                data-testid="button-cta-login"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/10 py-12 px-6 z-10 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Explore</Link>
                <Link href="/about" className="block text-sm text-gray-400 hover:text-white transition-colors">About</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Profile</Link>
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Bookmarks</Link>
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">History</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Settings</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Preferences</Link>
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Manage Feeds</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-white transition-colors" data-testid="link-privacy">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-white transition-colors" data-testid="link-terms">Terms of Service</Link>
                <Link href="/copyright" className="block text-sm text-gray-400 hover:text-white transition-colors" data-testid="link-copyright">Copyright Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-500">
              LUM News — The world's narratives in your hands
            </p>
          </div>
        </div>
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
          animation: fadeIn 1s ease-out both;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
