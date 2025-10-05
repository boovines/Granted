import { useEffect, useRef, useState } from 'react';
import { Button } from './components/ui/button';
import { ScrollArrow } from './components/ScrollArrow';
import { Header } from './components/Header';
import { initializeOAuth } from '../../../oauth/integration/vite';
import { oauthConfig } from '../../../oauth/config';
import researchPaper from 'figma:asset/f0dafa1bc33da6f1021110bc11ec146c00709978.png';
import ideScreenshot from 'figma:asset/2a39690196d69f1a45046159a61af6bc20907f69.png';
import teamPhoto from 'figma:asset/d5d3f577df0c6cdf655c0020b3131608c4d13cf5.png';

export default function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize OAuth - the callback handler will redirect to main app automatically
  useEffect(() => {
    initializeOAuth();
  }, []);

  const handleGoogleLogin = () => {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    
    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: oauthConfig.providers.google.clientId,
      redirect_uri: `${oauthConfig.app.redirectUrl}${oauthConfig.app.callbackPath}`,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = oauthUrl;
  };

  const scrollToSection = (index: number) => {
    if (isScrolling || !containerRef.current) return;
    
    setIsScrolling(true);
    const section = containerRef.current.children[index] as HTMLElement;
    
    section.scrollIntoView({ behavior: 'smooth' });
    setCurrentSection(index);
    
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 30 && currentSection < 2) {
        e.preventDefault();
        scrollToSection(currentSection + 1);
      } else if (e.deltaY < -30 && currentSection > 0) {
        e.preventDefault();
        scrollToSection(currentSection - 1);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [currentSection, isScrolling]);

  return (
    <>
      <Header />
      <div ref={containerRef} className="h-screen overflow-hidden">
        {/* Section 1: Hero */}
        <section className="h-screen w-full relative flex items-center justify-center overflow-hidden">
          {/* Left side - Research papers */}
          <div className="absolute left-0 top-0 w-1/2 h-full flex flex-col items-center justify-center gap-8 overflow-hidden">
            <img 
              src={researchPaper} 
              alt="Research paper 1" 
              className="w-1/3 opacity-40 shadow-2xl"
            />
            <img 
              src={researchPaper} 
              alt="Research paper 2" 
              className="w-1/3 opacity-40 shadow-2xl"
            />
            <img 
              src={researchPaper} 
              alt="Research paper 3" 
              className="w-1/3 opacity-40 shadow-2xl"
            />
          </div>

          {/* Right side - IDE screenshot */}
          <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center overflow-hidden">
            <img 
              src={ideScreenshot} 
              alt="IDE screenshot" 
              className="w-full opacity-40 shadow-2xl"
            />
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center px-8">
            <h1 className="text-8xl font-bold text-primary mb-4" style={{ fontFamily: 'Coolvetica, Montserrat, sans-serif' }}>
              Granted
            </h1>
            <p className="text-2xl text-foreground mb-12">
              An academic writing IDE
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg border-2 border-primary"
                size="lg"
                onClick={handleGoogleLogin}
              >
                Log in with Google
              </Button>
              <Button 
                variant="outline" 
                className="border-2 border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg"
                size="lg"
              >
                Continue as Guest
              </Button>
            </div>
          </div>

          {currentSection === 0 && <ScrollArrow />}
        </section>

      {/* Section 2: Mission */}
      <section className="h-screen w-full relative flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-6xl font-bold text-primary mb-8">Our mission</h2>
          <p className="text-3xl text-foreground">
            We want to make academic research papers easier to write so mfs can cop grants
          </p>
        </div>

        {currentSection === 1 && <ScrollArrow />}
      </section>

        {/* Section 3: Team */}
        <section className="h-screen w-full relative flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center px-8">
            <h2 className="text-6xl font-bold text-primary mb-12">Our Team</h2>
            
            <div className="mb-8">
              <img 
                src={teamPhoto} 
                alt="Team photo" 
                className="w-full max-w-3xl mx-auto rounded-lg shadow-2xl"
              />
            </div>

            <div className="grid grid-cols-4 gap-8 mt-12">
              <div>
                <h3 className="text-2xl text-primary">Justin Hou</h3>
              </div>
              <div>
                <h3 className="text-2xl text-primary">Jake Li</h3>
              </div>
              <div>
                <h3 className="text-2xl text-primary">Toby Thurston</h3>
              </div>
              <div>
                <h3 className="text-2xl text-primary">Jessica Wang</h3>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}