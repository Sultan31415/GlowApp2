import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Target, ArrowRight, MessageCircle, Camera, 
  Users, Clock, BarChart3, Zap, 
  CheckCircle, Brain, Shield, TrendingUp, Star, Eye, Heart, 
  Calendar, Trophy, Gamepad2, User, BookOpen, Dumbbell, Play, Activity, X, Bot, Image, Linkedin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AuroraBackground } from '../ui/AuroraBackground';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';
import { CircularGallery } from '../ui/CircularGallery';
import './AdvancedMainScreen.css';

interface AdvancedMainScreenProps {
  onStartTest: () => void;
}

export const AdvancedMainScreen: React.FC<AdvancedMainScreenProps> = ({ onStartTest }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [navCompressed, setNavCompressed] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [navScale, setNavScale] = useState(1);
  const [mobileDashboardTab, setMobileDashboardTab] = useState('profile');

  const sections = [
    { id: 'hero', name: 'Home' },
    { id: 'what-we-do', name: 'Platform' },
    { id: 'how-it-works', name: 'How It Works' },
    { id: 'contact', name: 'Contact' },
  ];

  const handleGetStarted = () => {
    if (isSignedIn) {
      onStartTest();
    } else {
      navigate('/sign-in');
    }
  };

  /* -----------------------------
   * Section highlight – IntersectionObserver instead of scroll polling
   * --------------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // Trigger when a section is roughly in the middle of the viewport
        root: null,
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  /* -----------------------------
   * Throttled nav transform on scroll (rAF + passive listener)
   * --------------------------- */
  useEffect(() => {
    const maxScroll = 300;
    const minScale = 0.95;
    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const clampedScroll = Math.min(scrollY, maxScroll);
      const newScale = 1 - (clampedScroll / maxScroll) * (1 - minScale);
      setNavScale(newScale);
      setNavCompressed(scrollY > 120);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <AuroraBackground>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Navigation */}
        <nav
          className={`bg-white/20 backdrop-blur-2xl border border-gray-200/30 shadow-lg fixed z-50 transition-all duration-500 ease-in-out px-0
            ${
              navCompressed
                ? "top-0 mx-auto max-w-4xl left-0 right-0 rounded-xl py-0.5"
                : "top-4 mx-auto max-w-4xl left-0 right-0 rounded-full py-1"
            }
          `}
          style={{ transform: `scale(${navScale})`, transformOrigin: 'top center', willChange: 'transform' }}
        >
          <div
            className={`mx-auto max-w-4xl px-4 flex items-center justify-between transition-all duration-300 ${
              navCompressed ? "py-0.5" : "py-1"
            }`}
          >
            <div className="flex items-center -space-x-1">
              <Logo 
                size={navCompressed ? 36 : 48}
                scale={1.7}
                animate={true}
                className="transition-all duration-300 rounded-lg" 
              />
              <span className={`font-extrabold tracking-tight text-gray-900 transition-all duration-300 ${navCompressed ? "text-base" : "text-lg"} ml-1`}>Oylan</span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              {sections.slice(1).map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => scrollToSection(e, section.id)}
                  className={`font-semibold text-base px-2 py-1 rounded-lg transition-all duration-300 relative group
                    ${activeSection === section.id ? "text-gray-900" : "text-gray-700 hover:text-black"}
                  `}
                >
                  {section.name}
                  {activeSection === section.id && (
                    <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-6 h-1 bg-gray-900 rounded-full opacity-80" />
                  )}
                </a>
              ))}
              <Button 
                onClick={handleGetStarted}
                className="ml-2 px-4 py-1.5 rounded-full bg-black/90 text-white font-semibold shadow-md hover:bg-black transition-all duration-200 text-base"
              >
                Get Started
              </Button>
            </div>
            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <Button 
                onClick={handleGetStarted}
                className="px-4 py-1.5 rounded-full bg-black/90 text-white font-semibold shadow-md hover:bg-black transition-all duration-200 text-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="relative flex flex-col items-center justify-center min-h-screen pt-40 pb-20">
          <div className="max-w-7xl mx-auto text-center px-4">
            {/* Main Headline */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-black mb-6 md:mb-8 leading-tight tracking-tighter"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              See Your Truth. <br />
              Become Your Potential.
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 md:mb-12 max-w-md md:max-w-4xl mx-auto leading-relaxed">
              Transform your life with AI-powered analysis, gamified stats, and atomic habits.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center items-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-base md:px-10 md:py-5 md:text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Start Your Transformation
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
            
          {/* Value Props - Styled like Dashboard */}
          <div className="w-full mt-24">
            <CircularGallery>
              {/* Glow Score Card */}
              <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-6 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                  <span className="text-2xl font-extrabold text-purple-700">72</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Glow Score</h3>
                <p className="text-gray-500 text-sm leading-snug mb-2 h-12 flex items-center">Discover your current potential and track your progress.</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  <span className="text-xs text-gray-400">Sample Score</span>
                </div>
              </div>
              {/* Daily Habits Card */}
              <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-6 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <CheckCircle className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Daily Habits</h3>
                <p className="text-gray-500 text-sm leading-snug mb-2 h-12 flex items-center">Build small habits for big changes, every day.</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Track Progress</span>
                </div>
              </div>
              {/* AI Coach Card */}
              <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-6 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-200">
                  <Bot className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">AI Coach</h3>
                <p className="text-gray-500 text-sm leading-snug mb-2 h-12 flex items-center">Personalized guidance & tips.</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Brain className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-gray-400">Get Insights</span>
                </div>
              </div>
              {/* Talk to Future Self Card */}
              <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-6 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-violet-200">
                  <MessageCircle className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Talk to Future Self</h3>
                <p className="text-gray-500 text-sm leading-snug mb-2 h-12 flex items-center">Get motivation from your transformed self.</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-gray-400">Get Motivated</span>
                </div>
              </div>
              {/* Future Self Avatar Card */}
              <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-6 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                  <Image className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Future Self Avatar</h3>
                <p className="text-gray-500 text-sm leading-snug mb-2 h-12 flex items-center">See your best version with an AI-generated avatar.</p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-gray-400">Visualize Potential</span>
                </div>
              </div>
            </CircularGallery>
          </div>
        </section>

        {/* What We Do - Dashboard Preview Style */}
        <section id="what-we-do" className="py-12 sm:py-16 px-2">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight flex items-center justify-center gap-2 sm:gap-4">
                <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 text-white font-extrabold text-base sm:text-xl flex-shrink-0">1</span>
                <span className="block">Your Life Analyzed,<br className="sm:hidden" /> Scientifically.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              </p>
            </div>

            {/* --- DESKTOP LAYOUT --- */}
            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-center">
              {/* Left Side: Profile & Age Analysis */}
              <div className="lg:col-span-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4 h-full">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-xl">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Your name</h3>
                      {/* Age Analysis Compact */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Age Analysis</h4>
                        <div className="grid grid-cols-3 gap-1 text-center">
                          <div>
                            <div className="text-lg sm:text-xl font-bold text-emerald-600">24</div>
                            <div className="text-xs text-gray-600">Biological</div>
                          </div>
                          <div>
                            <div className="text-lg sm:text-xl font-bold text-pink-600">26</div>
                            <div className="text-xs text-gray-600">Emotional</div>
                          </div>
                          <div>
                            <div className="text-lg sm:text-xl font-bold text-gray-700">28</div>
                            <div className="text-xs text-gray-600">Actual</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Performance Metrics */}
              <div className="lg:col-span-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3 md:p-5 h-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Wellness Metrics</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Track your performance in real-time.</p>
                    </div>
                    <div className="flex items-center space-x-1 self-end sm:self-center">
                       <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Glow Score</span>
                       <div className="flex items-baseline space-x-1">
                         <span className="text-xl sm:text-2xl font-black text-gray-900">72</span>
                         <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                         <span className="text-lg sm:text-xl font-extrabold text-emerald-600">85+</span>
                       </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {/* Physical Vitality */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-2">
                          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Zap className="w-4 h-4 text-purple-600" /></div>
                          <h4 className="text-sm font-semibold text-gray-900">Physical</h4>
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 sm:mb-2">66</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1 sm:mt-0"><div className="h-2 bg-purple-500 rounded-full" style={{ width: '66%' }}></div></div>
                    </div>
                    {/* Emotional Health */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-2">
                          <div className="w-7 h-7 bg-pink-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Heart className="w-4 h-4 text-pink-600" /></div>
                          <h4 className="text-sm font-semibold text-gray-900">Emotional</h4>
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 sm:mb-2">58</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1 sm:mt-0"><div className="h-2 bg-pink-500 rounded-full" style={{ width: '58%' }}></div></div>
                    </div>
                    {/* Visual Appearance */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Eye className="w-4 h-4 text-blue-600" /></div>
                          <h4 className="text-sm font-semibold text-gray-900">Visual</h4>
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 sm:mb-2">62</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1 sm:mt-0"><div className="h-2 bg-blue-500 rounded-full" style={{ width: '62%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow-Up Archetype Preview Card (Desktop only) */}
            <div className="mt-4 hidden lg:block">
              <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-start">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border border-gray-200/50">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                    You are like David Beckham during his prime
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                    Much like David Beckham, you embody a blend of charisma and determination. Your commitment to self-care and proactive health choices mirrors Beckham's dedication to fitness and style. While you face challenges in emotional health and social connections, your strengths in engaging activities and overcoming past habits reflect a journey of resilience. Just as Beckham transformed his image and career through hard work and passion, you too have the potential to enhance your well-being and social ties, paving the way for a vibrant future.
                  </p>
                </div>
              </div>
            </div>

            {/* --- MOBILE LAYOUT --- */}
            <div className="block lg:hidden">
              <div className="rounded-2xl border-white/50 p-4 space-y-4">
                {/* Tab Switcher */}
                <div className="flex justify-center bg-gray-100 rounded-full p-1">
                  <button 
                    onClick={() => setMobileDashboardTab('profile')}
                    className={`w-1/2 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${mobileDashboardTab === 'profile' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => setMobileDashboardTab('metrics')}
                    className={`w-1/2 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${mobileDashboardTab === 'metrics' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                  >
                    Metrics
                  </button>
                </div>

                {/* Tab Content */}
                <div>
                  {mobileDashboardTab === 'profile' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Profile Header */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-xl">
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-10 h-10 text-gray-400" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Your Future Self</h3>
                        <p className="text-gray-600 text-xs">A preview of your potential.</p>
                      </div>
                      {/* Age Analysis Compact */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 text-center">Age Analysis</h4>
                        <div className="grid grid-cols-3 gap-1 text-center">
                          <div>
                            <div className="text-lg font-bold text-emerald-600">24</div>
                            <div className="text-xs text-gray-600">Biological</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-pink-600">26</div>
                            <div className="text-xs text-gray-600">Emotional</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-700">28</div>
                            <div className="text-xs text-gray-600">Actual</div>
                          </div>
                        </div>
                      </div>
                      {/* Glow-Up Archetype Preview Card (Mobile only) */}
                      <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-start mt-2 lg:hidden">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border border-gray-200/50">
                          <User className="w-5 h-5 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">
                            You are like David Beckham during his prime
                          </h3>
                          <p className="text-gray-800 leading-relaxed text-sm">
                            Much like David Beckham, you embody a blend of charisma and determination. Your commitment to self-care and proactive health choices mirrors Beckham's dedication to fitness and style. While you face challenges in emotional health and social connections, your strengths in engaging activities and overcoming past habits reflect a journey of resilience. Just as Beckham transformed his image and career through hard work and passion, you too have the potential to enhance your well-being and social ties, paving the way for a vibrant future.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {mobileDashboardTab === 'metrics' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-900">Wellness Metrics</h3>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">GLOW</span>
                          <span className="text-xl font-black text-gray-900">72</span>
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Physical Vitality */}
                        <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Zap className="w-4 h-4 text-purple-600" /></div>
                              <h4 className="text-sm font-semibold text-gray-900">Physical</h4>
                            </div>
                            <div className="text-lg font-bold text-gray-900">66</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="h-2 bg-purple-500 rounded-full" style={{ width: '66%' }}></div></div>
                        </div>
                        {/* Emotional Health */}
                        <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-pink-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Heart className="w-4 h-4 text-pink-600" /></div>
                              <h4 className="text-sm font-semibold text-gray-900">Emotional</h4>
                            </div>
                            <div className="text-lg font-bold text-gray-900">58</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="h-2 bg-pink-500 rounded-full" style={{ width: '58%' }}></div></div>
                        </div>
                        {/* Visual Appearance */}
                        <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"><Eye className="w-4 h-4 text-blue-600" /></div>
                              <h4 className="text-sm font-semibold text-gray-900">Visual</h4>
                            </div>
                            <div className="text-lg font-bold text-gray-900">62</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="h-2 bg-blue-500 rounded-full" style={{ width: '62%' }}></div></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add extra spacing between sections */}
        <div className="mt-20" />

        {/* See Your Potential Transformation Section */}
        <section className="mt-12 mb-24">
          <h2 className="text-2xl sm:text-[2.2rem] md:text-[2.8rem] font-bold text-center text-gray-900 mb-5 leading-tight flex items-center justify-center gap-2 sm:gap-4">
            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-extrabold text-base sm:text-xl flex-shrink-0">2</span>
            <span className="block">See Your Potential<br className="sm:hidden" /> Transformation</span>
          </h2>
          <div className="flex flex-row flex-wrap justify-center items-center md:flex-row gap-6 mb-7">
            {/* Progress Stats */}
            <div className="flex flex-col items-center">
              <span className="text-[2.1rem] font-extrabold text-gray-900">75</span>
              <span className="text-gray-500 text-sm">Current</span>
            </div>
            <span className="text-[1.7rem] font-bold text-gray-400">→</span>
            <div className="flex flex-col items-center">
              <span className="text-[2.1rem] font-extrabold text-green-600">79</span>
              <span className="text-green-600 font-semibold text-sm">+4 in 7 days</span>
            </div>
            <span className="text-[1.7rem] font-bold text-gray-400">→</span>
            <div className="flex flex-col items-center">
              <span className="text-[2.1rem] font-extrabold text-pink-600">99</span>
              <span className="text-pink-600 font-semibold text-sm">+24 in 30 days</span>
            </div>
          </div>
          {/* Message from Future Self */}
          <div className="max-w-4xl mx-auto w-full mt-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-pink-200" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-700 text-center whitespace-nowrap">Message from Your Future Self</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-purple-200 to-pink-200" />
            </div>
            <div className="w-full bg-white/90 rounded-2xl shadow-xl p-8 sm:p-12 mx-auto">
              <blockquote className="italic text-gray-700 border-l-4 border-purple-300 pl-6 text-lg sm:text-xl leading-relaxed">
                Hey, it’s me—30 days from now. I remember feeling uncertain, just like you do now. But trust me, the journey ahead is incredible. You’ll find joy in small wins—like when you first notice your skin glowing or feel more energy. You’ll push through and feel so proud. I’m you, just a version that’s embraced change. We’re closer than you think!
              </blockquote>
            </div>
          </div>
        </section>

        {/* Personalized Weekly Plan Section (Visual with Book Covers) */}
        <section className="mt-36 mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6 leading-tight flex items-center justify-center gap-2 sm:gap-4">
            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-600 text-white font-extrabold text-base sm:text-lg flex-shrink-0">3</span>
            <span className="block">Your Personalized Habit<br className="sm:hidden" /> System & Routines</span>
          </h2>
          <div className="flex flex-col items-center">
            <div className="flex flex-row gap-20 justify-center items-end flex-wrap mt-10 mb-8">
              <div className="flex flex-col items-center">
                <img src="/atomic_habits.jpeg" alt="Atomic Habits" className="w-34 h-52 object-cover rounded-xl shadow-lg border-4 border-purple-200 transition-transform duration-300 hover:scale-105" />
                <span className="mt-3 text-base font-semibold text-purple-700 text-center">Atomic Habits</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/miracle_morning.jpg" alt="The Miracle Morning" className="w-34 h-52 object-cover rounded-xl shadow-lg border-4 border-blue-200 transition-transform duration-300 hover:scale-105" />
                <span className="mt-3 text-base font-semibold text-blue-700 text-center">The Miracle Morning</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/deep_work.jpg" alt="Deep Work" className="w-34 h-52 object-cover rounded-xl shadow-lg border-4 border-yellow-200 transition-transform duration-300 hover:scale-105" />
                <span className="mt-3 text-base font-semibold text-yellow-700 text-center">Deep Work</span>
              </div>
            </div>
            <div className="mt-8 text-lg md:text-xl text-gray-700 text-center max-w-2xl font-medium">
              Your system, plan, and habits are created based on these books.
            </div>
          </div>
        </section>

        {/* Divider between Habit System and Transformation Steps */}
        <div className="w-full flex justify-center my-4">
          <div className="h-1 w-2/3 bg-gradient-to-r from-green-200 via-gray-100 to-blue-200 rounded-full opacity-70" />
        </div>

        {/* How It Works - Visual Process */}
        <section id="how-it-works" className="py-12 sm:py-16 px-4 mt-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Transformation in 4 Steps
              </h2>
              <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                A simple, science-backed process to unlock your full potential.
              </p>
            </div>

            {/* Process Steps - Styled like Quick Actions from Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {[
                {
                  step: "01",
                  title: "Analysis",
                  description: "Complete a 5-min assessment & photo upload for a baseline score.",
                  icon: BarChart3,
                  color: "blue",
                },
                {
                  step: "02",
                  title: "Visualization",
                  description: "See your potential score and a preview of your future-self avatar.",
                  icon: User,
                  color: "purple",
                },
                {
                  step: "03",
                  title: "Transformation",
                  description: "Follow daily atomic habits and weekly life challenges to improve.",
                  icon: Target,
                  color: "green",
                },
                {
                  step: "04",
                  title: "Achievement",
                  description: "Track your progress in real-time and chat with your AI coach.",
                  icon: Trophy,
                  color: "orange",
                },
              ].map((item) => {
                const colors = {
                  blue: {
                    bg: "from-blue-50 to-indigo-50",
                    border: "border-blue-200/50",
                    iconBg: "bg-blue-100",
                    iconText: "text-blue-600",
                    stepText: "text-blue-500"
                  },
                  purple: {
                    bg: "from-purple-50 to-violet-50",
                    border: "border-purple-200/50",
                    iconBg: "bg-purple-100",
                    iconText: "text-purple-600",
                    stepText: "text-purple-500"
                  },
                  green: {
                    bg: "from-green-50 to-emerald-50",
                    border: "border-green-200/50",
                    iconBg: "bg-green-100",
                    iconText: "text-green-600",
                    stepText: "text-green-500"
                  },
                  orange: {
                    bg: "from-orange-50 to-amber-50",
                    border: "border-orange-200/50",
                    iconBg: "bg-orange-100",
                    iconText: "text-orange-600",
                    stepText: "text-orange-500"
                  }
                };
                const c = colors[item.color as keyof typeof colors];

                return (
                  <div key={item.step} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-3xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group hover:-translate-y-2`}>
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className={`p-3 ${c.iconBg} rounded-xl shadow-sm`}>
                        <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${c.iconText}`} />
                      </div>
                      <span className={`text-4xl sm:text-5xl font-bold text-gray-300/80 transition-all group-hover:text-gray-400/80`}>{item.step}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>

            {/* How It Works: Under the Hood - Agent Diagram */}
            <div className="flex flex-col items-center justify-center mt-32 mb-16">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10">How It Works: Under the Hood</h3>
              <div className="w-full flex flex-col items-center">
                <svg width="900" height="200" viewBox="0 0 900 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full">
                  {/* Quiz Agent */}
                  <circle cx="140" cy="100" r="70" fill="#f3f4f6" stroke="#a78bfa" strokeWidth="5" />
                  <text x="140" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#7c3aed">Quiz</text>
                  <text x="140" y="120" textAnchor="middle" fontSize="16" fill="#7c3aed">Agent</text>
                  {/* Photo Agent */}
                  <circle cx="370" cy="100" r="70" fill="#f3f4f6" stroke="#f472b6" strokeWidth="5" />
                  <text x="370" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#db2777">Photo</text>
                  <text x="370" y="120" textAnchor="middle" fontSize="16" fill="#db2777">Agent</text>
                  {/* Synthesis Agent */}
                  <circle cx="600" cy="100" r="70" fill="#f3f4f6" stroke="#34d399" strokeWidth="5" />
                  <text x="600" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#059669">Synthesis</text>
                  <text x="600" y="120" textAnchor="middle" fontSize="16" fill="#059669">Agent</text>
                  {/* Output Node */}
                  <circle cx="800" cy="100" r="50" fill="#f3f4f6" stroke="#6366f1" strokeWidth="4" />
                  <text x="800" y="105" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#6366f1">You</text>
                  {/* Arrows */}
                  <defs>
                    <linearGradient id="arrow1" x1="210" y1="100" x2="300" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a78bfa" />
                      <stop offset="1" stopColor="#f472b6" />
                    </linearGradient>
                    <linearGradient id="arrow2" x1="440" y1="100" x2="530" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f472b6" />
                      <stop offset="1" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="arrow3" x1="670" y1="100" x2="750" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  {/* Curved Arrows */}
                  <path d="M210 100 Q290 40 300 100" stroke="url(#arrow1)" strokeWidth="7" fill="none" />
                  <polygon points="300,100 292,94 292,106" fill="#f472b6" />
                  <path d="M440 100 Q520 160 530 100" stroke="url(#arrow2)" strokeWidth="7" fill="none" />
                  <polygon points="530,100 522,94 522,106" fill="#34d399" />
                  <path d="M670 100 Q740 40 750 100" stroke="url(#arrow3)" strokeWidth="7" fill="none" />
                  <polygon points="750,100 742,94 742,106" fill="#6366f1" />
                </svg>
                <div className="flex justify-between w-full max-w-4xl mt-8 text-lg text-gray-500 font-medium">
                  <span className="ml-2">Quiz Analysis</span>
                  <span>Photo Analysis</span>
                  <span className="mr-2">Holistic Output</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-20 sm:mt-24">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-base md:px-10 md:py-5 md:text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Get My Free Analysis
              </Button>
              <p className="text-gray-500 mt-4 text-sm">
                Takes 5 minutes &bull; 100% private & secure
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof - Simplified and restyled */}
        <section className="py-20 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Join <span className="text-purple-600">1000</span> people transforming their lives
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-12">Trusted by a fast-growing community of life-optimizers.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1">90K+</div>
                <div className="text-xs sm:text-sm text-gray-600">Habits Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1">4.9★</div>
                <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">87%</div>
                <div className="text-xs sm:text-sm text-gray-600">Achieve Goals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">90</div>
                <div className="text-xs sm:text-sm text-gray-600">Day Transformation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section - Restyled */}
        <section id="contact" className="pt-20 pb-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Ready to Start Your Journey?</h2>
            <p className="text-lg md:text-xl text-gray-600 mb-12">Get your free analysis today. No credit card required.</p>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-white/50 p-6 sm:p-10 max-w-4xl mx-auto">
              <div className="bg-gray-50/80 sm:bg-transparent rounded-2xl p-4 sm:p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8 divide-y sm:divide-y-0 divide-gray-200">
                  <div className="flex items-center gap-4 w-full pt-4 sm:pt-0 first:pt-0">
                    <MessageCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Email Support</div>
                      <a href="mailto:sultanyermakhan@gmail.com" className="text-gray-600 text-sm hover:text-purple-600">sultanyermakhan@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full pt-4 sm:pt-0">
                    <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Response Time</div>
                      <div className="text-gray-600 text-sm">Within 24 hours</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full pt-4 sm:pt-0">
                    <Linkedin className="w-6 h-6 text-sky-600 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">LinkedIn Profile</div>
                      <a href="https://www.linkedin.com/in/sultan-yermakhan-1a2245349/" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-sky-600">sultan-yermakhan</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg mt-8"
              >
                Start Your Transformation Now
              </Button>
              <p className="text-sm text-gray-500 mt-4">Free analysis &bull; See your future self &bull; Begin changing today</p>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-transparent py-8 px-4">
            <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Oylan. All rights reserved.
            </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}; 