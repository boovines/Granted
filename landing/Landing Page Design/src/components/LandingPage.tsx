import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../src/components/ui/button';
import { ScrollArrow } from '../../../../src/components/ScrollArrow';
import { Header } from '../../../../src/components/Header';
import { oauthConfig } from '../../../../oauth/config';
import researchPaper from '../assets/images/research-paper.png';
import ideScreenshot from '../assets/images/ide-screenshot.png';
import teamPhoto from '../assets/images/team-photo.png';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToApp: () => void;
}

export default function LandingPage({ onNavigateToLogin, onNavigateToApp }: LandingPageProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = () => {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    
    // Build OAuth URL - redirect to main app after OAuth
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
      <Header onNavigateToApp={onNavigateToApp} />
      <div ref={containerRef} className="h-screen overflow-hidden">
        {/* Section 1: Hero */}
        <section 
          className="h-screen w-full relative flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#354458' }}
        >

          {/* Right side - IDE screenshot */}
          <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center pr-16 overflow-hidden">
            <img 
              src={ideScreenshot} 
              alt="IDE screenshot" 
              className="w-2/3 shadow-2xl"
              style={{ opacity: 0.3 }}
            />
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center px-8">
            <h1 
              className="font-bold mb-6"
              style={{ 
                fontSize: '10rem',
                color: '#C4B998',
                fontFamily: 'Coolvetica, Arial, sans-serif',
                letterSpacing: '0',
                lineHeight: '1',
                fontWeight: '700'
              }}
            >
              Granted
            </h1>
            <p 
              className="mb-16"
              style={{ 
                fontSize: '2rem',
                color: '#C4B998',
                fontFamily: 'Coolvetica, Arial, sans-serif',
                fontWeight: '400',
                letterSpacing: '0.02em'
              }}
            >
              An academic writing IDE
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                className="px-12 py-4 text-xl font-medium rounded-xl transition-all"
                style={{
                  backgroundColor: '#C4B998',
                  color: '#2C3E50',
                  border: 'none',
                  fontFamily: 'Coolvetica, Arial, sans-serif',
                  minWidth: '280px',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
                onClick={handleGoogleLogin}
              >
                Log in with Google
              </button>
              <button
                className="px-12 py-4 text-xl font-medium rounded-xl transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: '#C4B998',
                  border: '2px solid #C4B998',
                  fontFamily: 'Coolvetica, Arial, sans-serif',
                  minWidth: '280px',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
                onClick={onNavigateToApp}
              >
                Continue as Guest
              </button>
            </div>
          </div>

          {currentSection === 0 && (
            <div 
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: '3rem' }}
            >
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#8A8673" 
                strokeWidth="2"
                className="animate-bounce"
              >
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </div>
          )}
        </section>

        {/* Section 2: Mission */}
        <section 
          className="h-screen w-full relative flex items-center justify-center"
          style={{ backgroundColor: '#2C3E50' }}
        >
          <div className="max-w-4xl mx-auto text-center px-16" style={{ marginTop: '-8rem' }}>
            <h2 
              className="font-bold mb-8"
              style={{ 
                fontSize: '5rem',
                color: '#C4B998',
                fontFamily: 'Coolvetica, Arial, sans-serif',
                fontWeight: '700'
              }}
            >
              Our Vision
            </h2>
            <p 
              style={{ 
                fontSize: '2.5rem',
                color: '#C4B998',
                fontFamily: 'Coolvetica, Arial, sans-serif',
                fontWeight: '400',
                lineHeight: '1.4'
              }}
            >
              Discover, draft, and ship grant proposals 10 times faster than ever before <br />
              so you can focus on the issues that truly matter.
            </p>
          </div>

          {currentSection === 1 && (
            <div 
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: '3rem' }}
            >
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#8A8673" 
                strokeWidth="2"
                className="animate-bounce"
              >
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </div>
          )}
        </section>

        {/* Section 3: Team */}
        <section 
          className="h-screen w-full relative flex items-center justify-center"
          style={{ backgroundColor: '#354458' }}
        >
          <div className="max-w-6xl mx-auto text-center px-8">
            <h2 
              className="font-bold mb-12"
              style={{ 
                fontSize: '5rem',
                color: '#C4B998',
                fontFamily: 'Coolvetica, Arial, sans-serif',
                fontWeight: '700'
              }}
            >
              Our Team
            </h2>
            
            <div className="mb-8">
              <img 
                src={teamPhoto} 
                alt="Team photo" 
                className="mx-auto rounded-lg shadow-2xl"
                style={{ width: '500px', height: 'auto' }}
              />
            </div>

            <div className="flex justify-center" style={{ marginTop: '3rem' }}>
              <div style={{ width: '200px', textAlign: 'center', marginRight: '40px' }}>
                <h3 
                  className="font-medium"
                  style={{ 
                    fontSize: '1.75rem',
                    color: '#C4B998',
                    fontFamily: 'Coolvetica, Arial, sans-serif',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Jake Li
                </h3>
              </div>
              <div style={{ width: '200px', textAlign: 'center', marginRight: '40px' }}>
                <h3 
                  className="font-medium"
                  style={{ 
                    fontSize: '1.75rem',
                    color: '#C4B998',
                    fontFamily: 'Coolvetica, Arial, sans-serif',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Toby Thurston
                </h3>
              </div>
              <div style={{ width: '200px', textAlign: 'center', marginRight: '40px' }}>
                <h3 
                  className="font-medium"
                  style={{ 
                    fontSize: '1.75rem',
                    color: '#C4B998',
                    fontFamily: 'Coolvetica, Arial, sans-serif',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Jessica Wang
                </h3>
              </div>
              <div style={{ width: '200px', textAlign: 'center' }}>
                <h3 
                  className="font-medium"
                  style={{ 
                    fontSize: '1.75rem',
                    color: '#C4B998',
                    fontFamily: 'Coolvetica, Arial, sans-serif',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Justin Hou
                </h3>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}