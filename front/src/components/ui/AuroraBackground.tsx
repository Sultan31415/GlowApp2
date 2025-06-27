"use client";
import { cn } from "../../lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main
      className={cn(
        "relative flex flex-col items-center transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.1)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.1)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.05)_7%,transparent_10%,transparent_12%,rgba(0,0,0,0.05)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#c4b5fd_25%,#60a5fa_30%,#c084fc_35%,#67e8f9_40%,#f9a8d4_45%,#6ee7b7_50%,#fbbf24_55%,#f472b6_60%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert-0 brightness-125 contrast-125
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-screen after:opacity-80
            pointer-events-none
            absolute -inset-[10px] opacity-90 will-change-transform`,

            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
        {/* Additional vibrant aurora layer */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-400/20 animate-aurora" 
               style={{
                 background: `linear-gradient(45deg, 
                   rgba(59, 130, 246, 0.3) 0%, 
                   rgba(168, 85, 247, 0.3) 25%, 
                   rgba(236, 72, 153, 0.3) 50%, 
                   rgba(14, 165, 233, 0.3) 75%, 
                   rgba(34, 197, 94, 0.3) 100%)`,
                 backgroundSize: '400% 400%',
                 animation: 'aurora 60s ease-in-out infinite alternate'
               }}>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}; 