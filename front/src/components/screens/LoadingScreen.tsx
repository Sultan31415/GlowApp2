import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Star, 
  CheckCircle2, 
  Clock,
  Bot,
  TrendingUp,
  Eye,
  FileText,
  Camera,
  Target,
  Loader2
} from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
}

export const LoadingScreen: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const steps: LoadingStep[] = [
    {
      id: 'quiz',
      label: 'Processing Quiz Responses',
      description: 'Analyzing your answers across all wellness categories',
      icon: FileText,
      estimatedTime: 3,
      status: 'completed'
    },
    {
      id: 'photo',
      label: 'Analyzing Your Photo',
      description: 'AI-powered facial analysis for biological age assessment',
      icon: Camera,
      estimatedTime: 4,
      status: 'completed'
    },
    {
      id: 'score',
      label: 'Calculating Glow Score',
      description: 'Computing your personalized wellness metrics',
      icon: TrendingUp,
      estimatedTime: 2,
      status: 'active'
    },
    {
      id: 'plan',
      label: 'Generating Transformation Plan',
      description: 'Creating your customized improvement roadmap',
      icon: Target,
      estimatedTime: 3,
      status: 'pending'
    }
  ];

  const [loadingSteps, setLoadingSteps] = useState(steps);

  // Simulate progress - reduced frequency to prevent excessive updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 0.5);
      setProgress(prev => {
        const newProgress = Math.min(prev + 2, 85); // Cap at 85% for realism
        return newProgress;
      });
    }, 500); // Changed from 100ms to 500ms (5x less frequent)

    return () => clearInterval(interval);
  }, []);

  // Update step statuses based on progress
  useEffect(() => {
    const totalTime = steps.reduce((acc, step) => acc + step.estimatedTime, 0);
    const progressTime = (progress / 100) * totalTime;
    
    let cumulativeTime = 0;
    const updatedSteps = steps.map((step, index) => {
      const stepStartTime = cumulativeTime;
      const stepEndTime = cumulativeTime + step.estimatedTime;
      cumulativeTime += step.estimatedTime;

      if (progressTime >= stepEndTime) {
        return { ...step, status: 'completed' as const };
      } else if (progressTime >= stepStartTime) {
        return { ...step, status: 'active' as const };
      } else {
        return { ...step, status: 'pending' as const };
      }
    });

    setLoadingSteps(updatedSteps);
  }, [progress]);

  const getStepProgress = (step: LoadingStep, index: number) => {
    if (step.status === 'completed') return 100;
    if (step.status === 'pending') return 0;
    
    // For active step, calculate partial progress
    const totalTime = steps.reduce((acc, s) => acc + s.estimatedTime, 0);
    const progressTime = (progress / 100) * totalTime;
    const prevStepsTime = steps.slice(0, index).reduce((acc, s) => acc + s.estimatedTime, 0);
    const stepProgress = ((progressTime - prevStepsTime) / step.estimatedTime) * 100;
    return Math.max(0, Math.min(100, stepProgress));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            {/* Main Icon with Enhanced Animation */}
            <div className="relative mb-8">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 w-40 h-40 mx-auto">
                <div className="w-full h-full border-4 border-purple-200 rounded-full animate-spin-slow opacity-60"></div>
              </div>
              
              {/* Main Icon Container */}
              <div className="relative w-40 h-40 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30 backdrop-blur-sm border border-white/20">
                  <Brain className="w-20 h-20 text-white animate-pulse" />
                </div>
                
                {/* Floating AI Icon */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Orbiting Elements */}
              <div className="absolute inset-0 w-40 h-40 mx-auto animate-spin-reverse">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </div>
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Eye className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
              Analyzing Your Assessment
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Our advanced AI is processing your responses and creating your personalized transformation journey
            </p>

            {/* Overall Progress Bar */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Time Indicator */}
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              <span>{Math.round(timeElapsed)}s elapsed</span>
            </div>
          </div>

          {/* Steps Section */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Processing Steps</h2>
              
              <div className="space-y-6">
                {loadingSteps.map((step, index) => {
                  const stepProgress = getStepProgress(step, index);
                  const Icon = step.icon;
                  
                  return (
                    <div
                      key={step.id}
                      className={`relative p-6 rounded-2xl border transition-all duration-700 ${
                        step.status === 'active' 
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg scale-105' 
                          : step.status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Step Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                          step.status === 'completed' 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                            : step.status === 'active'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                            : 'bg-gray-300'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : step.status === 'active' ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Icon className="w-6 h-6 text-gray-600" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              step.status === 'active' ? 'text-purple-900' : 
                              step.status === 'completed' ? 'text-emerald-900' : 'text-gray-700'
                            }`}>
                              {step.label}
                            </h3>
                            
                            {step.status === 'active' && (
                              <span className="text-sm font-medium text-purple-600">
                                {Math.round(stepProgress)}%
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-sm mb-3 transition-colors duration-300 ${
                            step.status === 'active' ? 'text-purple-700' : 
                            step.status === 'completed' ? 'text-emerald-700' : 'text-gray-500'
                          }`}>
                            {step.description}
                          </p>

                          {/* Step Progress Bar */}
                          {(step.status === 'active' || step.status === 'completed') && (
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                  step.status === 'completed' 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                                style={{ width: `${stepProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Active Step Glow Effect */}
                      {step.status === 'active' && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Message */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm leading-relaxed">
                  🔬 Our AI analyzes over 50 data points to create your personalized wellness profile
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }
        
        .animate-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};