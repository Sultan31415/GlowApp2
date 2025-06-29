import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Target, User, TrendingUp, Heart, ArrowRight, Star, MessageCircle, Camera, 
  Check, Users, RefreshCw, Clock, BarChart3, Trophy, Eye, Play, Crown, Zap, 
  CheckCircle, Facebook, Twitter, Instagram, Youtube, Linkedin, Brain
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
  const [currentAvatar, setCurrentAvatar] = useState(0);
  const [sliderValue, setSliderValue] = useState([30]);
  const [navScale, setNavScale] = useState(1);

  const sections = [
    { id: 'hero', name: 'Home' },
    { id: 'features', name: 'Features' },
    { id: 'how-it-works', name: 'How It Works' },
    { id: 'testimonials', name: 'Success Stories' },
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
  const maxScroll = 300; // px after which nav stops shrinking further
  const minScale = 0.95; // smallest horizontal scale

  const handleNavScroll = () => {
    const scrollY = window.scrollY;

    // Gradual scale calculation
    const clampedScroll = Math.min(scrollY, maxScroll);
    const newScale = 1 - (clampedScroll / maxScroll) * (1 - minScale);
    setNavScale(newScale);

    // Still toggle compressed class for other style tweaks
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

  const archetypes = [
    { name: "CEO", icon: Crown, color: "from-purple-500 to-pink-500" },
    { name: "Fit", icon: Target, color: "from-green-500 to-blue-500" },
    { name: "Romantic", icon: Heart, color: "from-pink-500 to-red-500" },
    { name: "Calm", icon: Sparkles, color: "from-blue-500 to-cyan-500" },
    { name: "Boss", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { name: "Healing", icon: Star, color: "from-green-400 to-emerald-500" },
  ];

  const habits = [
    { habit: "+30 min sleep", impact: "Better skin & energy" },
    { habit: "Drink 1L water", impact: "Clearer complexion" },
    { habit: "10 min walk", impact: "Improved posture" },
    { habit: "Morning meditation", impact: "Reduced stress lines" },
  ];

  const testimonials = [
    { name: "Sarah M.", score: 8.2, improvement: "+2.1", image: "/placeholder.svg?height=60&width=60" },
    { name: "Alex K.", score: 9.1, improvement: "+1.8", image: "/placeholder.svg?height=60&width=60" },
    { name: "Maya L.", score: 8.7, improvement: "+2.3", image: "/placeholder.svg?height=60&width=60" },
  ];

  return (
    <AuroraBackground>
      <div className="min-h-screen">
        {/* Navigation */}
        <nav
          className={`bg-white/20 backdrop-blur-2xl border border-gray-200/30 shadow-lg fixed z-50 transition-all duration-500 ease-in-out px-0
            ${
              navCompressed
                ? "top-0 mx-auto max-w-4xl left-0 right-0 rounded-xl py-0.5" // compressed: only adjust top & radius
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
              <span className={`font-extrabold tracking-tight text-gray-900 transition-all duration-300 ${navCompressed ? "text-lg" : "text-xl"} ml-1`}>GlowApp</span>
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
        <section id="hero" className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-40">
          <div className="max-w-7xl mx-auto text-center">
            {/* Main Headline */}
            <h1
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl 2xl:text-8xl font-extrabold text-gray-900 mb-10 leading-tight tracking-wide text-center max-w-5xl mx-auto"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              See the Truth.<br />
              Become the Potential.
            </h1>
            <p className="text-3xl md:text-4xl text-gray-600 mb-20 max-w-3xl mx-auto">
              Analyze your life today.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Your GlowApp
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
              >
                <Play className="mr-2 w-5 h-5" />
                Learn More
              </Button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Users", value: "12,847", icon: Users, color: "blue", trend: "+8.5%" },
                { title: "Transformations", value: "8,293", icon: Target, color: "purple", trend: "+12.3%" },
                { title: "Avg GlowScore", value: "8.7", icon: BarChart3, color: "green", trend: "-2.1%" },
                { title: "Active Plans", value: "4,521", icon: Clock, color: "orange", trend: "+5.8%" },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp
                        className={`w-4 h-4 mr-1 ${stat.trend.startsWith("+") ? "text-green-500" : "text-red-500 rotate-180"}`}
                      />
                      <span className={`font-medium ${stat.trend.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {stat.trend}
                      </span>
                      <span className="text-gray-500 ml-1">
                        {stat.title === "Transformations" ? "Up from past week" : "Up from yesterday"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Revolutionary Features Section */}
        <section id="features" className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-25 to-indigo-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Revolutionary AI Features
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Your Ultimate Glow-Up Experience
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Cutting-edge AI technology that analyzes, transforms, and guides your journey to your highest potential
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Visual Transformation Avatar */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-white/80 rounded-xl shadow-sm">
                      <Camera className="w-8 h-8 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 border border-green-200">Coming Soon</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Visual Transformation Avatar</h3>
                  <p className="text-gray-600 mb-6">AI-powered avatar showing your full potential with detailed metrics and visual transformation preview</p>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      AI-generated future self visualization
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Real-time progress tracking
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Biological age analysis
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Atomic Glow-Up System */}
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-white/80 rounded-xl shadow-sm">
                      <Target className="w-8 h-8 text-red-600" />
                    </div>
                    <Badge className="bg-red-100 text-red-700 border border-red-200">Coming Soon</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Atomic Glow-Up System</h3>
                  <p className="text-gray-600 mb-6">30-day micro-habits and challenges scientifically designed to reach your full glow potential</p>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                      Personalized daily micro-habits
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                      Proven transformation methodology
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                      Gamified challenge system
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Coach */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-white/80 rounded-xl shadow-sm">
                      <Brain className="w-8 h-8 text-orange-600" />
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Coming Soon</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">AI Personal Coach</h3>
                  <p className="text-gray-600 mb-6">Your 24/7 AI coach providing personalized guidance, tips, and motivation for your transformation journey</p>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-orange-500 mr-2" />
                      Real-time personalized guidance
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-orange-500 mr-2" />
                      Adaptive coaching strategies
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-orange-500 mr-2" />
                      24/7 motivation and support
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Glow Score Analytics Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 mb-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 mb-4">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Advanced Analytics
                  </Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    Get Your Complete Glow Score Analysis
                  </h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Our AI analyzes 50+ factors across Physical Vitality, Emotional Health, and Visual Appearance to give you a comprehensive wellness score with actionable insights.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Physical Vitality Score</h4>
                        <p className="text-sm text-gray-600">Energy, fitness & strength analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                        <Heart className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Emotional Health Score</h4>
                        <p className="text-sm text-gray-600">Mood, stress & resilience tracking</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Visual Appearance Score</h4>
                        <p className="text-sm text-gray-600">Skin, style & confidence metrics</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center bg-white rounded-xl shadow-lg px-6 py-4 mb-4">
                      <span className="text-sm font-semibold text-gray-600 mr-4">Your Glow Score</span>
                      <div className="flex items-center">
                        <span className="text-3xl font-black text-gray-900">78</span>
                        <div className="flex items-center ml-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-lg font-bold text-emerald-600">→85+</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Potential to reach 85+ with our AI guidance</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Physical Vitality</span>
                      <span className="text-sm font-bold text-purple-600">82/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-purple-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Emotional Health</span>
                      <span className="text-sm font-bold text-pink-600">75/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-pink-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Visual Appearance</span>
                      <span className="text-sm font-bold text-blue-600">77/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '77%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 mb-6">
                <Target className="w-4 h-4 mr-2" />
                Simple Process
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">From Analysis to Transformation</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Four simple steps to unlock your complete transformation potential
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Complete Assessment",
                  description: "15 detailed questions analyzing your lifestyle, habits, and wellness goals",
                  icon: MessageCircle,
                  color: "from-blue-200 to-blue-600",
                },
                {
                  step: "02",
                  title: "Upload Photo",
                  description: "AI analyzes your photo for biological age, facial features, and glow potential",
                  icon: Camera,
                  color: "from-purple-200 to-pink-500",
                },
                {
                  step: "03",
                  title: "Get Your Scores",
                  description: "Receive detailed Glow Score breakdown with personalized archetype analysis",
                  icon: BarChart3,
                  color: "from-pink-200 to-red-500",
                },
                {
                  step: "04",
                  title: "Start Transforming",
                  description: "Access your dashboard with AI-powered features and transformation roadmap",
                  icon: Sparkles,
                  color: "from-green-200 to-green-600",
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-500 transform hover:-translate-y-2 group"
                >
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-500 mb-2">{item.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-25 to-red-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-pink-100 text-pink-700 border border-pink-200 mb-6">
                <Star className="w-4 h-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Real Transformations</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See how our AI-powered platform has helped thousands discover their potential
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  name: "Sarah M.",
                  age: 28,
                  glowScore: 85,
                  improvement: "+18 points",
                  archetype: "Radiant Achiever",
                  quote: "The biological age analysis was mind-blowing - I'm actually 3 years younger than my chronological age! The personalized insights helped me understand exactly what to focus on.",
                  metrics: {
                    physical: 88,
                    emotional: 82,
                    visual: 85
                  }
                },
                {
                  name: "Alex K.",
                  age: 32,
                  glowScore: 91,
                  improvement: "+24 points",
                  archetype: "Balanced Transformer",
                  quote: "The Glow Score breakdown showed me I was stronger emotionally than I thought, but needed to work on physical vitality. The targeted approach really works!",
                  metrics: {
                    physical: 85,
                    emotional: 95,
                    visual: 92
                  }
                },
                {
                  name: "Maya L.",
                  age: 25,
                  glowScore: 87,
                  improvement: "+21 points",
                  archetype: "Confident Visionary",
                  quote: "Seeing my future self avatar was incredibly motivating. The AI analysis gave me concrete steps to reach my full potential. I feel more confident than ever!",
                  metrics: {
                    physical: 90,
                    emotional: 84,
                    visual: 87
                  }
                }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                          <p className="text-sm text-gray-500">{testimonial.archetype}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900">{testimonial.glowScore}</span>
                          <div className="ml-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-600">{testimonial.improvement}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Physical Vitality</span>
                        <span className="font-bold text-purple-600">{testimonial.metrics.physical}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${testimonial.metrics.physical}%` }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Emotional Health</span>
                        <span className="font-bold text-pink-600">{testimonial.metrics.emotional}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 bg-pink-500 rounded-full" style={{ width: `${testimonial.metrics.emotional}%` }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Visual Appearance</span>
                        <span className="font-bold text-blue-600">{testimonial.metrics.visual}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${testimonial.metrics.visual}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Your Transformation Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gray-100 text-gray-600 border border-gray-200 mb-6">
              <MessageCircle className="w-4 h-4 mr-2" />
              Get in Touch
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">Contact Us</h2>
            <p className="text-xl text-gray-600 mb-12">Have questions about GlowApp? We're here to help!</p>

            <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Email Us</h3>
                        <p className="text-gray-600">support@glowapp.ai</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Follow Us</h3>
                        <p className="text-gray-600">@glowapp.ai</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleGetStarted}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                    >
                      Start Your Transformation
                    </Button>
                    <Button variant="outline" className="w-full transition-all duration-300 transform hover:scale-105">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AuroraBackground>
  );
}; 