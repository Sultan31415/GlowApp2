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
  TrendingUp,
  MessageCircle,
  Bot
} from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { useMediaQuery } from '../../hooks';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { Button } from './Button';

interface NavigationProps {
  onStartTest: () => void;
  hasResults: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onStartTest, hasResults, isExpanded, setIsExpanded }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userBtnWrapperRef = React.useRef<HTMLDivElement>(null);
  const navRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const { t } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'ru'>(i18n.language as 'en' | 'ru');

  useEffect(() => {
    const storedLang = localStorage.getItem('appLang');
    if (storedLang && storedLang !== language) {
      setLanguage(storedLang as 'en' | 'ru');
      i18n.changeLanguage(storedLang);
    }
  }, []);

  const handleLanguageSwitch = () => {
    const newLang = language === 'en' ? 'ru' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('appLang', newLang);
  };

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

  const handleItemClick = (itemOnClick: () => void) => () => {
    itemOnClick();
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Navigation items configuration
  const navItems = [
    {
      id: 'home',
      label: t('sidebar.dashboard'),
      icon: hasResults ? BarChart3 : Home,
      onClick: () => (hasResults ? navigate('/dashboard') : navigate('/')),
      isAvailable: true,
      tooltip: hasResults ? t('sidebar.dashboardTooltip') : t('sidebar.homeTooltip'),
      description: hasResults ? t('sidebar.dashboardDescription') : t('sidebar.homeDescription'),
      isActive: isRouteActive('/dashboard') || (location.pathname === '/' && hasResults)
    },
    {
      id: 'assessment',
      label: t('sidebar.takeAssessment'),
      icon: Camera,
      onClick: () => {
        console.log('Navigation - Assessment button clicked');
        onStartTest();
      },
      isAvailable: true,
      tooltip: t('sidebar.assessmentTooltip'),
      description: t('sidebar.assessmentDescription'),
      isActive: location.pathname === '/test'
    },
    {
      id: 'transformation',
      label: t('sidebar.transformation'),
      icon: Image,
      onClick: () => navigate('/future'),
      isAvailable: true, // was false, now true
      tooltip: t('sidebar.transformationTooltip'),
      description: t('sidebar.transformationDescription'),
      isActive: isRouteActive('/future')
    },
    {
      id: 'habits',
      label: t('sidebar.habits'),
      icon: Calendar,
      onClick: () => navigate('/daily-plan'),
      isAvailable: true,
      tooltip: t('sidebar.habitsTooltip'),
      description: t('sidebar.habitsDescription'),
      isActive: isRouteActive('/daily-plan')
    },
    {
      id: 'chat',
      label: t('sidebar.chat'),
      icon: MessageCircle,
      onClick: () => navigate('/ai-chat'),
      isAvailable: true,
      tooltip: t('sidebar.chatTooltip'),
      description: t('sidebar.chatDescription'),
      isActive: isRouteActive('/ai-chat')
    },
    {
      id: 'telegram',
      label: t('sidebar.telegram'),
      icon: Bot,
      onClick: () => navigate('/telegram-login'),
      isAvailable: true,
      tooltip: t('sidebar.telegramTooltip'),
      description: t('sidebar.telegramDescription'),
      isActive: location.pathname === '/telegram-login'
    },
    {
      id: 'progress',
      label: t('sidebar.progress'),
      icon: TrendingUp,
      onClick: () => navigate('/progress'),
      isAvailable: true,
      tooltip: t('sidebar.progressTooltip'),
      description: t('sidebar.progressDescription'),
      isActive: isRouteActive('/progress')
    }
  ];

  const contentIsExpanded = isMobile || isExpanded;
  
  return (
    <>
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-[60] p-2 bg-white/20 backdrop-blur-md rounded-full text-gray-800 shadow-lg border border-white/20"
          aria-label="Open menu"
        >
          <PanelLeftOpen className="w-6 h-6" />
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen text-gray-800 flex flex-col py-4 shadow-2xl z-50 ${
          isMobile
            ? `w-64 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-white/80 backdrop-blur-md border-r border-white/30 rounded-r-3xl`
            : `ml-2 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'} bg-white/10 backdrop-blur-lg border-r border-white/20 rounded-r-3xl border border-white/30`
        }`}
        onMouseEnter={isMobile ? undefined : () => setIsSidebarHovered(true)}
        onMouseLeave={isMobile ? undefined : () => {
          setIsSidebarHovered(false);
          setHoveredItem(null);
        }}
        onMouseMove={isMobile ? undefined : handleMouseMove}
      >
        {/* Logo + Toggle */}
        {contentIsExpanded ? (
          /* Expanded header: logo left, collapse button right */
          <div className="flex items-center justify-between px-4 mb-6">
            <div className="flex items-center space-x-3">
              <Logo size={40} scale={2.5} animate={true} className="" />
              {contentIsExpanded && (
                <span className="text-lg font-bold text-gray-800 whitespace-nowrap">Oylan</span>
              )}
            </div>
            <button
              onClick={() => isMobile ? setMobileMenuOpen(false) : setIsExpanded(false)}
              className="focus:outline-none transition-all duration-300 hover:scale-110"
              title={isMobile ? t('sidebar.collapse') : t('sidebar.collapse')}
            >
              <PanelLeftClose className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        ) : (
          /* Collapsed: show logo, reveal expand icon on hover */
          !isMobile && (
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
                  {t('sidebar.expand')}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
                </div>
              )}
            </button>
          )
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1 w-full px-2 flex-1">
          {navItems.map((item) => {
            const magnification = !isMobile ? calculateMagnification(item.id, hoveredItem) : 1;
            const isHovered = !isMobile && hoveredItem === item.id;
            
            return (
              <button
                key={item.id}
                ref={(el) => { navRefs.current[item.id] = el; }}
                onClick={handleItemClick(item.onClick)}
                disabled={!item.isAvailable}
                onMouseEnter={isMobile ? undefined : () => setHoveredItem(item.id)}
                onMouseLeave={isMobile ? undefined : () => setHoveredItem(null)}
                className={`w-full rounded-xl transition-all duration-300 ease-out flex focus:outline-none relative group ${
                  !item.isAvailable 
                    ? 'opacity-40 cursor-not-allowed' 
                    : item.isActive
                    ? 'bg-white/40 text-gray-900 shadow-lg'
                    : 'text-gray-700 hover:bg-white/30 hover:text-gray-900'
                } ${
                  contentIsExpanded 
                    ? 'flex-row items-center px-3' 
                    : 'flex-col items-center justify-center'
                }`}
                style={{
                  transform: `scale(${magnification})`,
                  transformOrigin: contentIsExpanded ? 'left center' : 'center',
                  paddingTop: contentIsExpanded ? '12px' : `${12 * magnification}px`,
                  paddingBottom: contentIsExpanded ? '12px' : `${12 * magnification}px`,
                  marginTop: contentIsExpanded ? '0' : `${2 * (magnification - 1)}px`,
                  marginBottom: contentIsExpanded ? '0' : `${2 * (magnification - 1)}px`,
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                {/* Active indicator */}
                {item.isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                )}
                
                <div className={`relative flex items-center justify-center ${!contentIsExpanded ? 'mb-1' : ''}`}>
                  <item.icon 
                    className={`transition-all duration-300 ease-out ${
                      contentIsExpanded ? 'w-6 h-6' : 'w-7 h-7'
                    } ${item.isActive ? 'text-purple-600' : ''}`}
                  />
                  
                  {/* Tooltip for collapsed state */}
                  {!contentIsExpanded && isHovered && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg ring-1 ring-white/10 z-50 whitespace-nowrap text-[11px] leading-tight">
                      {item.tooltip}
                      {!item.isAvailable && <span className="text-yellow-300 ml-1">({t('sidebar.comingSoon')})</span>}
                      {/* Arrow */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
                    </div>
                  )}
                </div>
                
                {/* Label for expanded state */}
                {contentIsExpanded && (
                  <div className="ml-3 flex-1 text-left">
                    <div className="text-sm font-semibold tracking-wide">{item.label}</div>
                    {item.description && (
                      <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
                    )}
                    {!item.isAvailable && (
                      <div className="text-xs text-amber-600 mt-0.5">{t('sidebar.comingSoon')}</div>
                    )}
                  </div>
                )}

                {/* Status indicators for expanded state */}
                {contentIsExpanded && !item.isAvailable && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="w-full px-2 pb-2 flex flex-col items-center">
          <Button
            onClick={handleLanguageSwitch}
            className={`w-full py-2 rounded-xl border-2 border-purple-500 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 ${
              language === 'ru' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
            aria-label="Switch language"
          >
            {language === 'en' ? 'Рус' : 'EN'}
          </Button>
        </div>
        {/* Account Section */}
        <div className="w-full mt-auto px-2 pt-4 border-t border-white/20">
          <SignedIn>
            <div
              ref={userBtnWrapperRef}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (isMobile) setMobileMenuOpen(false);
                const target = e.target as HTMLElement;
                // Detect the actual Clerk trigger element (they typically mark it with data-user-button-trigger)
                const isRealTrigger = target.closest('[data-user-button-trigger]') || target.closest('button');
                if (isRealTrigger) return; // Native click will open the menu

                // Otherwise, find the internal trigger and simulate a click
                const triggerEl = userBtnWrapperRef.current?.querySelector('[data-user-button-trigger], button');
                (triggerEl as HTMLElement | null)?.click();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (isMobile) setMobileMenuOpen(false);
                  const triggerEl = userBtnWrapperRef.current?.querySelector('[data-user-button-trigger], button');
                  (triggerEl as HTMLElement | null)?.click();
                }
              }}
              onMouseEnter={isMobile ? undefined : () => setHoveredItem('account')}
              onMouseLeave={isMobile ? undefined : () => setHoveredItem(null)}
              className={`w-full rounded-xl transition-all duration-300 ease-out flex cursor-pointer text-gray-700 hover:bg-white/30 hover:text-gray-900 ${
                contentIsExpanded ? 'flex-row items-center py-3 px-3' : 'flex-col items-center justify-center py-3'
              }`}
              style={{
                transform: !isMobile && hoveredItem === 'account' ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: contentIsExpanded ? 'left center' : 'center',
              }}
            >
              <div className={`relative flex items-center justify-center ${!contentIsExpanded ? 'mb-1' : ''}`}>
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
                {!contentIsExpanded && hoveredItem === 'account' && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-lg ring-1 ring-white/10 z-50 whitespace-nowrap text-[11px] leading-tight">
                    {t('sidebar.account')}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(0,0,0,0.7)]"></div>
                  </div>
                )}
              </div>
              
              {contentIsExpanded && (
                <div className="ml-3 flex-1 text-left">
                  <div className="text-sm font-semibold tracking-wide">{t('sidebar.account')}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t('sidebar.manageProfile')}</div>
                </div>
              )}
              
              {contentIsExpanded && (
                <Settings className="w-4 h-4 opacity-50" />
              )}
            </div>
          </SignedIn>
        </div>
      </aside>
    </>
  );
};