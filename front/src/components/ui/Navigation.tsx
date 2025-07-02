import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  PanelLeftOpen, 
  PanelLeftClose, 
  BarChart3,
  Camera,
  Calendar,
  Sparkles,
  Activity,
  Settings,
  Image,
  TrendingUp
} from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

interface NavigationProps {
  onStartTest: () => void;
  hasResults: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onStartTest, hasResults, isExpanded, setIsExpanded }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userBtnWrapperRef = React.useRef<HTMLDivElement>(null);
  const navRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Helper function to check if a route is active
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || (hasResults && location.pathname === '/dashboard');
    }
    return location.pathname === path;
  };

  // Calculate magnification based on distance from hovered item
  const calculateMagnification = (itemId: string, hoveredId: string | null) => {
    if (!hoveredId || hoveredId === itemId) {
      return hoveredId === itemId ? 1.4 : 1.0; // 1.4x for hovered item, 1.0x for others when no hover
    }

    const currentElement = navRefs.current[itemId];
    const hoveredElement = navRefs.current[hoveredId];
    
    if (!currentElement || !hoveredElement) return 1.0;

    const currentRect = currentElement.getBoundingClientRect();
    const hoveredRect = hoveredElement.getBoundingClientRect();
    
    // Calculate center-to-center distance
    const currentCenter = currentRect.top + currentRect.height / 2;
    const hoveredCenter = hoveredRect.top + hoveredRect.height / 2;
    const distance = Math.abs(currentCenter - hoveredCenter);
    
    // Magnification falls off with distance
    const maxDistance = 120; // pixels
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Easing function for smooth falloff
    const easeOut = 1 - Math.pow(normalizedDistance, 2);
    
    // Scale from 1.0 to 1.2 based on proximity
    return 1.0 + (easeOut * 0.2);
  };

  // Handle mouse move for smooth tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Navigation items configuration
  const navItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: hasResults ? BarChart3 : Home,
      onClick: () => (hasResults ? navigate('/dashboard') : navigate('/')),
      isAvailable: true,
      tooltip: hasResults ? 'View Dashboard' : 'Home',
      description: hasResults ? 'Your wellness analytics' : 'Welcome home',
      isActive: isRouteActive('/dashboard') || (location.pathname === '/' && hasResults)
    },
    {
      id: 'assessment',
      label: 'Take Assessment',
      icon: Camera,
      onClick: () => {
        console.log('Navigation - Assessment button clicked');
        onStartTest();
      },
      isAvailable: true,
      tooltip: 'Take Assessment',
      description: 'Quiz + Photo Analysis',
      isActive: location.pathname === '/test'
    },
    {
      id: 'transformation',
      label: 'Transformation',
      icon: Image,
      onClick: () => navigate('/future'),
      isAvailable: false,
      tooltip: 'Transformation',
      description: 'See your potential',
      isActive: isRouteActive('/future')
    },
    {
      id: 'habits',
      label: 'My Habits',
      icon: Calendar,
      onClick: () => navigate('/micro-habits'),
      isAvailable: false,
      tooltip: 'My Habits',
      description: 'Personalized micro-habits',
      isActive: isRouteActive('/micro-habits')
    },
    {
      id: 'progress',
      label: 'Progress Tracker',
      icon: TrendingUp,
      onClick: () => navigate('/progress'),
      isAvailable: false,
      tooltip: 'Progress Tracker',
      description: 'Track your transformation',
      isActive: isRouteActive('/progress')
    }
  ];
  
  return (
    <aside
      className={`fixed top-0 left-0 h-screen ml-2 ${isExpanded ? 'w-64' : 'w-16'} bg-white/10 backdrop-blur-lg border-r border-white/20 text-gray-800 flex flex-col py-4 shadow-2xl z-50 transition-all duration-300 rounded-r-3xl border border-white/30`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => {
        setIsSidebarHovered(false);
        setHoveredItem(null);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Logo + Toggle */}
      {isExpanded ? (
        /* Expanded header: logo left, collapse button right */
        <div className="flex items-center justify-between px-4 mb-6">
          <div className="flex items-center space-x-3">
            <Logo size={40} scale={2.5} animate={true} className="" />
            {isExpanded && (
              <span className="text-lg font-bold text-gray-800 whitespace-nowrap">Oylan</span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="focus:outline-none transition-all duration-300 hover:scale-110"
            title="Collapse"
          >
            <PanelLeftClose className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      ) : (
        /* Collapsed: show logo, reveal expand icon on hover */
        <button
          onClick={() => { setIsExpanded(true); setHoveredItem(null); }}
          className="relative mx-auto mb-4 flex items-center justify-center focus:outline-none group"
          onMouseEnter={() => setHoveredItem('logo')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Container ensures consistent visual weight whether showing the logo or the expand icon */}
          <div className={`flex h-12 w-12 items-center justify-center transition-all duration-300 ease-out ${
              (hoveredItem === 'logo' || isSidebarHovered) ? 'scale-110' : ''
            }`}>
            {(hoveredItem === 'logo' || isSidebarHovered) ? (
              <PanelLeftOpen className="w-6 h-6 text-gray-800" />
            ) : (
              <Logo size={40} scale={2.5} animate={true} />
            )}
          </div>
          {!isExpanded && (hoveredItem === 'logo') && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg ring-1 ring-white/10 z-50 whitespace-nowrap text-[11px] leading-tight">
              Expand
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
            </div>
          )}
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-1 w-full px-2 flex-1">
        {navItems.map((item) => {
          const magnification = calculateMagnification(item.id, hoveredItem);
          const isHovered = hoveredItem === item.id;
          
          return (
            <button
              key={item.id}
              ref={(el) => { navRefs.current[item.id] = el; }}
              onClick={item.onClick}
              disabled={!item.isAvailable}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full rounded-xl transition-all duration-300 ease-out flex focus:outline-none relative group ${
                !item.isAvailable 
                  ? 'opacity-40 cursor-not-allowed' 
                  : item.isActive
                  ? 'bg-white/40 text-gray-900 shadow-lg'
                  : 'text-gray-700 hover:bg-white/30 hover:text-gray-900'
              } ${
                isExpanded 
                  ? 'flex-row items-center px-3' 
                  : 'flex-col items-center justify-center'
              }`}
              style={{
                transform: `scale(${magnification})`,
                transformOrigin: isExpanded ? 'left center' : 'center',
                paddingTop: isExpanded ? '12px' : `${12 * magnification}px`,
                paddingBottom: isExpanded ? '12px' : `${12 * magnification}px`,
                marginTop: isExpanded ? '0' : `${2 * (magnification - 1)}px`,
                marginBottom: isExpanded ? '0' : `${2 * (magnification - 1)}px`,
                zIndex: isHovered ? 10 : 1,
              }}
            >
              {/* Active indicator */}
              {item.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
              )}
              
              <div className={`relative flex items-center justify-center ${!isExpanded ? 'mb-1' : ''}`}>
                <item.icon 
                  className={`transition-all duration-300 ease-out ${
                    isExpanded ? 'w-6 h-6' : 'w-7 h-7'
                  } ${item.isActive ? 'text-purple-600' : ''}`}
                />
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && isHovered && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg ring-1 ring-white/10 z-50 whitespace-nowrap text-[11px] leading-tight">
                    {item.tooltip}
                    {!item.isAvailable && <span className="text-yellow-300 ml-1">(soon)</span>}
                    {/* Arrow */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
                  </div>
                )}
              </div>
              
              {/* Label for expanded state */}
              {isExpanded && (
                <div className="ml-3 flex-1 text-left">
                  <div className="text-sm font-semibold tracking-wide">{item.label}</div>
                  {item.description && (
                    <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
                  )}
                  {!item.isAvailable && (
                    <div className="text-xs text-amber-600 mt-0.5">Coming Soon</div>
                  )}
                </div>
              )}

              {/* Status indicators for expanded state */}
              {isExpanded && !item.isAvailable && (
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Account Section */}
      <div className="w-full mt-auto px-2 pt-4 border-t border-white/20">
        <SignedIn>
          <div
            ref={userBtnWrapperRef}
            role="button"
            tabIndex={0}
            onClick={() => {
              const el = userBtnWrapperRef.current?.querySelector('button, div');
              (el as HTMLElement | null)?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const el = userBtnWrapperRef.current?.querySelector('button, div');
                (el as HTMLElement | null)?.click();
              }
            }}
            onMouseEnter={() => setHoveredItem('account')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full rounded-xl transition-all duration-300 ease-out flex cursor-pointer text-gray-700 hover:bg-white/30 hover:text-gray-900 ${
              isExpanded ? 'flex-row items-center py-3 px-3' : 'flex-col items-center justify-center py-3'
            }`}
            style={{
              transform: hoveredItem === 'account' ? 'scale(1.1)' : 'scale(1)',
              transformOrigin: isExpanded ? 'left center' : 'center',
            }}
          >
            <div className={`relative flex items-center justify-center ${!isExpanded ? 'mb-1' : ''}`}>
              <div className="transition-all duration-300 ease-out">
                <UserButton
                  afterSignOutUrl='/'
                  appearance={{ 
                    elements: { 
                      avatarBox: 'w-6 h-6 transition-all duration-300' 
                    } 
                  }}
                />
              </div>
              
              {/* Tooltip for collapsed account */}
              {!isExpanded && hoveredItem === 'account' && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg ring-1 ring-white/10 z-50 whitespace-nowrap text-[11px] leading-tight">
                  Account
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
                </div>
              )}
            </div>
            
            {isExpanded && (
              <div className="ml-3 flex-1 text-left">
                <div className="text-sm font-semibold tracking-wide">Account</div>
                <div className="text-xs opacity-70 mt-0.5">Manage your profile</div>
              </div>
            )}
            
            {isExpanded && (
              <Settings className="w-4 h-4 opacity-50" />
            )}
          </div>
        </SignedIn>
      </div>
    </aside>
  );
};