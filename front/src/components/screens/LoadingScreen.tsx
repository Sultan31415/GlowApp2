import React from 'react';
import {
  FileText,
  Camera,
  TrendingUp,
  Target,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  status?: 'pending' | 'active' | 'completed';
}

interface LoadingScreenProps {
  isLoading?: boolean;
  /** The id of the step that is currently in progress */
  currentStep?: string;
  /** Optionally override the default steps */
  steps?: LoadingStep[];
}

// --------------------------------------------------
// Default configuration
// --------------------------------------------------

const DEFAULT_STEPS: LoadingStep[] = [
  {
    id: 'quiz',
    label: 'Processing Quiz',
    icon: FileText,
  },
  {
    id: 'photo',
    label: 'Analyzing Photo',
    icon: Camera,
  },
  {
    id: 'score',
    label: 'Calculating Score',
    icon: TrendingUp,
  },
  {
    id: 'plan',
    label: 'Generating Results',
    icon: Target,
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading = true,
  currentStep = 'score',
  steps,
}) => {
  // --------------------------------------------------
  // Auto-progression state
  // --------------------------------------------------
  const [autoCurrentStep, setAutoCurrentStep] = React.useState<string>('quiz');
  const [isAutoProgressing, setIsAutoProgressing] = React.useState<boolean>(true);

  // Use auto-progression step if enabled, otherwise use prop
  const effectiveCurrentStep = isAutoProgressing ? autoCurrentStep : currentStep;

  // --------------------------------------------------
  // Auto-progression effect
  // --------------------------------------------------
  React.useEffect(() => {
    if (!isAutoProgressing || !isLoading) return;

    const baseSteps = steps ?? DEFAULT_STEPS;
    const currentStepIndex = baseSteps.findIndex(s => s.id === autoCurrentStep);
    
    // Progress to next step after a delay, even for the last step initially
    const timer = setTimeout(() => {
      const nextStep = baseSteps[currentStepIndex + 1];
      if (nextStep) {
        setAutoCurrentStep(nextStep.id);
      } else {
        // We've reached beyond the last step, stop auto-progression
        setIsAutoProgressing(false);
      }
    }, 3000); // 3 seconds per step

    return () => clearTimeout(timer);
  }, [autoCurrentStep, isAutoProgressing, isLoading, steps]);

  /* -----------------------------------------------------------------
   * Derive loading state.
   * ----------------------------------------------------------------- */
  const loadingSteps = React.useMemo(() => {
    const baseSteps = steps ?? DEFAULT_STEPS;

    const currentIdx = baseSteps.findIndex((s) => s.id === effectiveCurrentStep);

    return baseSteps.map((step, idx) => {
      let status: 'pending' | 'active' | 'completed' = 'pending';

      if (idx < currentIdx) status = 'completed';
      else if (idx === currentIdx) status = 'active';

      return { ...step, status } as LoadingStep;
    });
  }, [steps, effectiveCurrentStep]);

  const activeStep = loadingSteps.find((step) => step.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-teal-50">
      {/* Clean Header */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/60 via-blue-50/60 to-teal-50/60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mr-3" />
            <h1 className="text-lg lg:text-xl font-medium text-slate-700">Processing your results…</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        
                 {/* Main Loading Section */}
         <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-8 text-center">
           
           {/* Simple Loading Indicator */}
           <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-6" />

           {/* Current Status */}
           {activeStep && (
             <div className="mb-6">
               <h2 className="text-xl font-medium text-gray-900 mb-2" aria-live="polite">
                 {activeStep.label}
               </h2>
               <p className="text-sm text-gray-500">Please wait while we process your data.</p>
             </div>
           )}

           {/* Simple Progress Indicator */}
           <div
             className="flex items-center justify-center space-x-2"
             role="progressbar"
             aria-valuemin={0}
             aria-valuemax={loadingSteps.length}
             aria-valuenow={loadingSteps.findIndex((s) => s.status === 'active') + 1}
           >
             {loadingSteps.map((step) => (
               <span
                 key={step.id}
                 className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                   step.status === 'completed'
                     ? 'bg-green-500'
                     : step.status === 'active'
                     ? 'bg-indigo-500 animate-pulse'
                     : 'bg-gray-300'
                 }`}
               />
             ))}
           </div>
         </div>

                 {/* Steps Overview */}
         <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
           <h3 className="font-medium text-gray-900 mb-4 text-center">Steps</h3>
          
          <div className="space-y-4">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                    step.status === 'active' 
                      ? 'bg-indigo-50 border-2 border-indigo-200' 
                      : step.status === 'completed'
                      ? 'bg-green-50 border-2 border-green-200' 
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  {/* Step Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : step.status === 'active'
                        ? 'bg-indigo-500'
                        : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                                     {/* Step Content */}
                   <div className="flex-1">
                     <h4
                       className={`font-medium ${
                         step.status === 'active'
                           ? 'text-indigo-900'
                           : step.status === 'completed'
                           ? 'text-green-900'
                           : 'text-gray-700'
                       }`}
                     >
                       {step.label}
                     </h4>
                   </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      <span className="w-2 h-2 bg-green-500 rounded-full block" />
                    )}
                    {step.status === 'active' && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          
        </div>
      </div>
    </div>
  );
};