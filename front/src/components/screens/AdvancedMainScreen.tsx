import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Target, ArrowRight, MessageCircle, Camera, 
  Users, Clock, BarChart3, Zap, 
  CheckCircle, Brain, Shield, TrendingUp, Star, Eye, Heart, 
  Calendar, Trophy, Gamepad2, User, BookOpen, Dumbbell, Play, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AuroraBackground } from '../ui/AuroraBackground';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';

interface AdvancedMainScreenProps {
  onStartTest: () => void;
}

export const AdvancedMainScreen: React.FC<AdvancedMainScreenProps> = ({ onStartTest }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
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
                size={navCompressed ? 40 : 64}
                scale={1.9}
                animate={true}
                className="transition-all duration-300 rounded-lg" 
              />
              <span className={`font-extrabold tracking-tight text-gray-900 transition-all duration-300 ${navCompressed ? "text-lg" : "text-xl"} ml-1`}>Oylan</span>
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
              <button
                onClick={() => setIsVisible((v) => !v)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
                aria-label="Open main menu"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Nav Drawer */}
        {isVisible && (
          <div className="md:hidden bg-white/80 backdrop-blur-2xl border border-gray-200/60 px-4 pt-2 pb-4 rounded-3xl shadow-xl animate-fade-in mx-2 mt-2">
            <div className="flex flex-col space-y-2">
              {sections.slice(1).map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    scrollToSection(e, section.id);
                    setIsVisible(false);
                  }}
                  className={`font-semibold text-base px-3 py-2 rounded-lg transition-all duration-200
                    ${activeSection === section.id ? "text-gray-900" : "text-gray-700 hover:text-black"}
                  `}
                >
                  {section.name}
                </a>
              ))}
              <Button 
                onClick={handleGetStarted}
                className="mt-2 px-6 py-2 rounded-xl bg-black text-white font-semibold shadow hover:bg-gray-900 transition-all duration-300 w-full"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section id="hero" className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-40 pb-20">
          <div className="max-w-7xl mx-auto text-center">
            {/* Main Headline */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tighter"
            >
              See Your Truth. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                Become Your Potential.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your life with AI-powered analysis, gamified stats, and atomic habits.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center items-center mb-24">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gray-900 hover:bg-black text-white px-10 py-5 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Start Your Transformation
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Value Props - Styled like Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-lg text-left">
                <div className="w-12 h-12 bg-white/70 rounded-xl flex items-center justify-center mb-4">
                  <Gamepad2 className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Your Glow Score</h3>
                <p className="text-gray-600 text-sm">See your current score & unlock your 90-day potential.</p>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-lg text-left">
                <div className="w-12 h-12 bg-white/70 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Daily Habits</h3>
                <p className="text-gray-600 text-sm">Follow micro-habits and complete weekly life challenges.</p>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-lg text-left">
                <div className="w-12 h-12 bg-white/70 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">AI Coach</h3>
                <p className="text-gray-600 text-sm">Get guidance from an AI that is your future self.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do - Dashboard Preview Style */}
        <section id="what-we-do" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Life, Gamified.
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Oylan turns self-improvement into an engaging game. Here's a preview of your personalized dashboard.
              </p>
            </div>

            {/* Main Feature Showcase - Rebuilt to look like Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Side: Profile & Age Analysis */}
              <div className="lg:col-span-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 h-full">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">Your Future Self</h3>
                      <p className="text-gray-600">A preview of your potential.</p>
                      
                      {/* Age Analysis Compact */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Age Analysis</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-2xl font-bold text-emerald-600">24</div>
                            <div className="text-xs text-gray-600">Biological</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-pink-600">26</div>
                            <div className="text-xs text-gray-600">Emotional</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-700">28</div>
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
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Wellness Metrics</h3>
                      <p className="text-gray-600">Track your performance in real-time.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Glow Score</span>
                       <div className="flex items-baseline space-x-1">
                         <span className="text-3xl font-black text-gray-900">72</span>
                         <TrendingUp className="w-5 h-5 text-emerald-500" />
                         <span className="text-2xl font-extrabold text-emerald-600">85+</span>
                       </div>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Physical Vitality */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3"><Zap className="w-4 h-4 text-purple-600" /></div>
                        <h4 className="text-base font-semibold text-gray-900">Physical</h4>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-4">66</div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 bg-purple-500 rounded-full" style={{ width: '66%' }}></div></div>
                    </div>
                    {/* Emotional Health */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3"><Heart className="w-4 h-4 text-pink-600" /></div>
                        <h4 className="text-base font-semibold text-gray-900">Emotional</h4>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-4">58</div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 bg-pink-500 rounded-full" style={{ width: '58%' }}></div></div>
                    </div>
                    {/* Visual Appearance */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3"><Eye className="w-4 h-4 text-blue-600" /></div>
                        <h4 className="text-base font-semibold text-gray-900">Visual</h4>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-4">62</div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 bg-blue-500 rounded-full" style={{ width: '62%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Visual Process */}
        <section id="how-it-works" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Transformation in 4 Steps
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
            <div className="text-center mt-24">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gray-900 hover:bg-black text-white px-10 py-5 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
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
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join <span className="text-purple-600">1000</span> people transforming their lives
            </h2>
            <p className="text-lg text-gray-600 mb-12">Trusted by a fast-growing community of life-optimizers.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-1">90K+</div>
                <div className="text-sm text-gray-600">Habits Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-1">4.9★</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-1">87%</div>
                <div className="text-sm text-gray-600">Achieve Goals</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-1">90</div>
                <div className="text-sm text-gray-600">Day Transformation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section - Restyled */}
        <section id="contact" className="pt-20 pb-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-600 mb-12">Get your free analysis today. No credit card required.</p>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-white/50 p-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-10 mb-8">
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
              </div>
              
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="w-full bg-gray-900 hover:bg-black text-white py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
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