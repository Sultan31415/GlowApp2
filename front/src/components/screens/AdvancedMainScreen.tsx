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

  // Scroll handling for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          return scrollPosition >= offsetTop && scrollPosition < offsetBottom;
        }
        return false;
      });
      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections, activeSection]);

  // Nav compress on scroll
  const maxScroll = 300;
  const minScale = 0.95;

  const handleNavScroll = () => {
    const scrollY = window.scrollY;
    const clampedScroll = Math.min(scrollY, maxScroll);
    const newScale = 1 - (clampedScroll / maxScroll) * (1 - minScale);
    setNavScale(newScale);

    if (scrollY > 120) {
      setNavCompressed(true);
    } else {
      setNavCompressed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleNavScroll);
    return () => window.removeEventListener("scroll", handleNavScroll);
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
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold text-black mb-8 leading-tight tracking-tighter"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              See Your Truth. <br />
              Become Your Potential.
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 mb-12 max-w-md md:max-w-4xl mx-auto leading-relaxed">
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
            <div className="scrolling-wrapper">
              <div className="scrolling-content">
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={i}>
                    {/* Glow Score Card */}
                    <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-4 md:p-7 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[140px] min-h-[140px] max-w-[220px] max-h-[220px] mx-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                        <span className="text-xl md:text-2xl font-extrabold text-purple-700">72</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Glow Score</h3>
                      <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-normal mb-2 h-12 flex items-center">Discover your current potential and track your progress.</p>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                        <span className="text-xs text-gray-400">Sample Score</span>
                      </div>
                    </div>
                    {/* Daily Habits Card */}
                    <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-4 md:p-7 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[140px] min-h-[140px] max-w-[220px] max-h-[220px] mx-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                        <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Daily Habits</h3>
                      <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-normal mb-2 h-12 flex items-center">Build small habits for big changes, every day.</p>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                        <span className="text-xs text-gray-400">Track Progress</span>
                      </div>
                    </div>
                    {/* AI Coach Card */}
                    <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-4 md:p-7 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[140px] min-h-[140px] max-w-[220px] max-h-[220px] mx-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-200">
                        <Bot className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">AI Coach</h3>
                      <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-normal mb-2 h-12 flex items-center">Personalized guidance & tips.</p>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <Brain className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                        <span className="text-xs text-gray-400">Get Insights</span>
                      </div>
                    </div>
                    {/* Talk to Future Self Card */}
                    <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-4 md:p-7 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[140px] min-h-[140px] max-w-[220px] max-h-[220px] mx-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-violet-200">
                        <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Talk to Future Self</h3>
                      <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-normal mb-2 h-12 flex items-center">Get motivation from your transformed self.</p>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <Heart className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                        <span className="text-xs text-gray-400">Get Motivated</span>
                      </div>
                    </div>
                     {/* Future Self Avatar Card */}
                     <div className="group bg-white/70 backdrop-blur-lg rounded-2xl aspect-square flex flex-col items-center justify-center p-4 md:p-7 border border-white/60 shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-[140px] min-h-[140px] max-w-[220px] max-h-[220px] mx-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                        <Image className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Future Self Avatar</h3>
                      <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-normal mb-2 h-12 flex items-center">See your best version with an AI-generated avatar.</p>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        <span className="text-xs text-gray-400">Visualize Potential</span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What We Do - Dashboard Preview Style */}
        <section id="what-we-do" className="py-20 sm:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Life, Gamified.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Oylan turns self-improvement into an engaging game. Here's a preview of your personalized dashboard.
              </p>
            </div>

            {/* Main Feature Showcase - Rebuilt to look like Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-center">
              
              {/* Left Side: Profile & Age Analysis */}
              <div className="lg:col-span-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Your Future Self</h3>
                      <p className="text-gray-600">A preview of your potential.</p>
                      
                      {/* Age Analysis Compact */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Age Analysis</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600">24</div>
                            <div className="text-xs text-gray-600">Biological</div>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-pink-600">26</div>
                            <div className="text-xs text-gray-600">Emotional</div>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-700">28</div>
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
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 md:p-8 h-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Wellness Metrics</h3>
                      <p className="text-sm sm:text-base text-gray-600">Track your performance in real-time.</p>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                       <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Glow Score</span>
                       <div className="flex items-baseline space-x-1">
                         <span className="text-2xl sm:text-3xl font-black text-gray-900">72</span>
                         <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                         <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">85+</span>
                       </div>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Physical Vitality */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"><Zap className="w-4 h-4 text-purple-600" /></div>
                          <h4 className="text-base font-semibold text-gray-900">Physical</h4>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 sm:mb-4">66</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 sm:mt-0"><div className="h-2 bg-purple-500 rounded-full" style={{ width: '66%' }}></div></div>
                    </div>
                    {/* Emotional Health */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-4">
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"><Heart className="w-4 h-4 text-pink-600" /></div>
                          <h4 className="text-base font-semibold text-gray-900">Emotional</h4>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 sm:mb-4">58</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 sm:mt-0"><div className="h-2 bg-pink-500 rounded-full" style={{ width: '58%' }}></div></div>
                    </div>
                    {/* Visual Appearance */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex items-center sm:mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"><Eye className="w-4 h-4 text-blue-600" /></div>
                          <h4 className="text-base font-semibold text-gray-900">Visual</h4>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 sm:mb-4">62</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 sm:mt-0"><div className="h-2 bg-blue-500 rounded-full" style={{ width: '62%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Visual Process */}
        <section id="how-it-works" className="py-20 sm:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Transformation in 4 Steps
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                A simple, science-backed process to unlock your full potential.
              </p>
            </div>

            {/* Process Steps - Styled like Quick Actions from Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div key={item.step} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-3xl p-8 hover:shadow-xl transition-all duration-300 group hover:-translate-y-2`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-3 ${c.iconBg} rounded-xl shadow-sm`}>
                        <item.icon className={`w-6 h-6 ${c.iconText}`} />
                      </div>
                      <span className={`text-5xl font-bold text-gray-300/80 transition-all group-hover:text-gray-400/80`}>{item.step}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-8 mb-8">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Email Support</div>
                    <a href="mailto:sultanyermakhan@gmail.com" className="text-gray-600 text-sm hover:text-purple-600">sultanyermakhan@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Response Time</div>
                    <div className="text-gray-600 text-sm">Within 24 hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Linkedin className="w-6 h-6 text-sky-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">LinkedIn Profile</div>
                    <a href="https://www.linkedin.com/in/sultan-yermakhan-1a2245349/" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-sky-600">sultan-yermakhan</a>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
              >
                Start Your Transformation Now
              </Button>
              <p className="text-sm text-gray-500">Free analysis &bull; See your future self &bull; Begin changing today</p>
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