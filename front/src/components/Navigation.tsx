import React, { useState } from 'react';
import { 
  Home, 
  PanelLeftOpen, 
  PanelLeftClose, 
  BarChart3,
  Camera,
  Target,
  Sparkles,
  MessageCircle,
  Settings
} from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  onStartTest: () => void;
  hasResults: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onStartTest, hasResults, isExpanded, setIsExpanded }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userBtnWrapperRef = React.useRef<HTMLDivElement>(null);

  // Helper function to check if a route is active
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || (hasResults && location.pathname === '/dashboard');
    }
    return location.pathname === path;
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
      onClick: onStartTest,
      isAvailable: true,
      tooltip: 'Take Assessment',
      description: 'Quiz + Photo Analysis',
      isActive: location.pathname === '/test'
    },
    {
      id: 'habits',
      label: 'My Habits',
      icon: Target,
      onClick: () => navigate('/micro-habits'),
      isAvailable: hasResults,
      tooltip: 'My Habits',
      description: 'Personalized micro-habits',
      isActive: isRouteActive('/micro-habits')
    },
    {
      id: 'transformation',
      label: 'Transformation',
      icon: Sparkles,
      onClick: () => navigate('/future'),
      isAvailable: hasResults,
      tooltip: 'Transformation',
      description: 'See your potential',
      isActive: isRouteActive('/future')
    },
    {
      id: 'coach',
      label: 'AI Coach',
      icon: MessageCircle,
      onClick: () => {},
      isAvailable: false,
      tooltip: 'AI Coach (Coming Soon)',
      description: 'Personal wellness coach',
      isActive: false
    }
  ];
  
  return (
    <aside
      className={`fixed top-0 left-0 h-screen ml-2 ${isExpanded ? 'w-64' : 'w-16'} bg-white/10 backdrop-blur-lg border-r border-white/20 text-gray-800 flex flex-col py-4 shadow-2xl z-50 transition-all duration-300 rounded-r-3xl border border-white/30`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      {/* Logo + Toggle */}
      {isExpanded ? (
        /* Expanded header: logo left, collapse button right */
        <div className="flex items-center justify-between px-4 mb-6">
          <div className="flex items-center space-x-2">
            <img src="/lcon.png" alt="GlowApp" className="w-8 h-8" />
            {isExpanded && <span className="text-lg font-bold text-gray-800">GlowApp</span>}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="focus:outline-none transition-transform hover:scale-110"
            title="Collapse"
          >
            <PanelLeftClose className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      ) : (
        /* Collapsed: show logo, reveal expand icon on hover */
        <button
          onClick={() => { setIsExpanded(true); setHoveredItem(null); }}
          className="relative mx-auto mb-6 flex items-center justify-center focus:outline-none"
          onMouseEnter={() => setHoveredItem('logo')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className={`transition-transform duration-200 ${(hoveredItem === 'logo' || isSidebarHovered) ? 'scale-110' : ''}`}>
            {(hoveredItem === 'logo' || isSidebarHovered) ? (
              <PanelLeftOpen className="w-8 h-8 text-gray-800" />
            ) : (
              <img src="/lcon.png" alt="GlowApp" className="w-8 h-8" />
            )}
          </div>
          {!isExpanded && (hoveredItem === 'logo') && (
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">
              Expand
            </span>
          )}
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-2 w-full px-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={!item.isAvailable}
            className={`w-full rounded-xl transition-all duration-200 flex focus:outline-none relative group ${
              !item.isAvailable 
                ? 'opacity-40 cursor-not-allowed' 
                : item.isActive
                ? 'bg-white/40 text-gray-900 shadow-lg'
                : 'text-gray-700 hover:bg-white/30 hover:text-gray-900'
            } ${
              isExpanded 
                ? 'flex-row items-center py-3 px-3' 
                : 'flex-col items-center justify-center py-3'
            }`}
          >
            {/* Active indicator */}
            {item.isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
            )}
            
            <div className={`relative flex items-center justify-center ${!isExpanded ? 'mb-1' : ''}`}>
              <item.icon 
                className={`w-6 h-6 transition-all duration-200 ${
                  item.isAvailable && hoveredItem === item.id ? 'scale-110' : ''
                } ${item.isActive ? 'text-purple-600' : ''}`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              />
              
              {/* Tooltip for collapsed state */}
              {!isExpanded && hoveredItem === item.id && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-black text-white rounded-lg shadow-lg whitespace-nowrap z-50">
                  <div className="text-sm font-semibold">{item.tooltip}</div>
                  {item.description && (
                    <div className="text-xs opacity-80 mt-1">{item.description}</div>
                  )}
                  {!item.isAvailable && (
                    <div className="text-xs text-yellow-300 mt-1">Coming Soon</div>
                  )}
                  {/* Arrow pointing to the button */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black"></div>
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
        ))}
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
            className={`w-full rounded-xl transition-all duration-200 flex cursor-pointer text-gray-700 hover:bg-white/30 hover:text-gray-900 ${
              isExpanded ? 'flex-row items-center py-3 px-3' : 'flex-col items-center justify-center py-3'
            }`}
          >
            <div className={`relative flex items-center justify-center ${!isExpanded ? 'mb-1' : ''}`}>
              <div
                onMouseEnter={() => setHoveredItem('account')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <UserButton
                  afterSignOutUrl='/'
                  appearance={{ 
                    elements: { 
                      avatarBox: `w-6 h-6 transition-transform duration-200 ${hoveredItem === 'account' ? 'scale-110' : ''}` 
                    } 
                  }}
                />
              </div>
              
              {/* Tooltip for collapsed account */}
              {!isExpanded && hoveredItem === 'account' && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-black text-white rounded-lg shadow-lg whitespace-nowrap z-50">
                  <div className="text-sm font-semibold">Account</div>
                  <div className="text-xs opacity-80 mt-1">Manage your profile</div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black"></div>
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