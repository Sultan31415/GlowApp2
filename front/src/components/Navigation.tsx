import React, { useState } from 'react';
import { Plus, Target, MessageCircle, Home, PanelLeftOpen, PanelLeftClose, ListChecks } from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

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
  const userBtnWrapperRef = React.useRef<HTMLDivElement>(null);
  
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
          <img src="/lcon.png" alt="Logo" className="w-8 h-8" />
          <button
            onClick={() => setIsExpanded(false)}
            className="focus:outline-none transition-transform hover:scale-110"
            title="Collapse"
          >
            <PanelLeftClose className="w-8 h-8 text-gray-800" />
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
              <img src="/lcon.png" alt="Logo" className="w-8 h-8" />
            )}
          </div>
          {!isExpanded && (hoveredItem === 'logo') && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">Expand</span>}
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-1 w-full px-2 flex-1">
        {/* HOME (new section) */}
        <button
          onClick={() => (hasResults ? navigate('/dashboard') : navigate('/'))}
          className={`w-full rounded-lg transition-all duration-200 flex focus:outline-none text-gray-700 ${isExpanded ? 'flex-row items-center py-2 px-2 hover:ring-2 hover:ring-gray-800 hover:bg-white/30 hover:text-gray-900' : 'flex-col items-center justify-center'}`}
        >
          <div className={`relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
            <Home 
              className={`w-6 h-6 transition-transform duration-200 ${hoveredItem === 'home' ? 'scale-110' : ''}`}
              onMouseEnter={() => setHoveredItem('home')}
              onMouseLeave={() => setHoveredItem(null)}
            />
            {!isExpanded && hoveredItem === 'home' && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">HOME</span>}
          </div>
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">HOME</span>}​
        </button>

        {/* CREATE  GLow app */}
        <button
          onClick={onStartTest}
          className={`w-full rounded-lg transition-all duration-200 flex focus:outline-none text-gray-700 ${isExpanded ? 'flex-row items-center py-2 px-2 hover:ring-2 hover:ring-gray-800 hover:bg-white/30 hover:text-gray-900' : 'flex-col items-center justify-center'}`}
        >
          <div className={`relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
            <Plus 
              className={`w-6 h-6 transition-transform duration-200 ${hoveredItem === 'glowup' ? 'scale-110' : ''}`}
              onMouseEnter={() => setHoveredItem('glowup')}
              onMouseLeave={() => setHoveredItem(null)}
            />
            {!isExpanded && hoveredItem === 'glowup' && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">Test</span>}
          </div>
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">Test</span>}​
        </button>

        {/* My plan (formerly GOALS) */}
        <button
          onClick={() => {/* Future feature */}}
          disabled
          className={`w-full rounded-lg transition-all duration-200 flex focus:outline-none opacity-50 cursor-not-allowed ${isExpanded ? 'flex-row items-center py-2 px-2' : 'flex-col items-center justify-center'}`}
        >
          <div className={`group/icon relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
            <Target className="w-6 h-6 transition-transform duration-200" />
          </div>
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">My plan</span>}​
        </button>

        {/* COACH */}
        <button
          onClick={() => {/* Future feature */}}
          className={`w-full rounded-lg transition-all duration-200 flex focus:outline-none text-gray-700 ${isExpanded ? 'flex-row items-center py-2 px-2 hover:ring-2 hover:ring-gray-800 hover:bg-white/30 hover:text-gray-900' : 'flex-col items-center justify-center'}`}
        >
          <div className={`relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
            <MessageCircle 
              className={`w-6 h-6 transition-transform duration-200 ${hoveredItem === 'coach' ? 'scale-110' : ''}`}
              onMouseEnter={() => setHoveredItem('coach')}
              onMouseLeave={() => setHoveredItem(null)}
            />
            {!isExpanded && hoveredItem === 'coach' && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">Coach</span>}
          </div>
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">COACH</span>}​
        </button>

        {/* MICRO HABITS */}
        <button
          onClick={() => navigate('/micro-habits')}
          className={`w-full rounded-lg transition-all duration-200 flex focus:outline-none text-gray-700 ${isExpanded ? 'flex-row items-center py-2 px-2 hover:ring-2 hover:ring-gray-800 hover:bg-white/30 hover:text-gray-900' : 'flex-col items-center justify-center'}`}
        >
          <div className={`relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
            <ListChecks
              className={`w-6 h-6 transition-transform duration-200 ${hoveredItem === 'microhabits' ? 'scale-110' : ''}`}
              onMouseEnter={() => setHoveredItem('microhabits')}
              onMouseLeave={() => setHoveredItem(null)}
            />
            {!isExpanded && hoveredItem === 'microhabits' && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">Micro Habits</span>}
          </div>
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">Micro Habits</span>}
        </button>
      </nav>
      {/* Account */}
      <div className="w-full mt-auto px-2">
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
            className={`w-full rounded-lg transition-all duration-200 flex cursor-pointer text-gray-700 ${isExpanded ? 'flex-row items-center py-2 px-2' : 'flex-col items-center justify-center'}`}
          >
            <div className={`relative flex items-center justify-center ${!isExpanded ? 'p-2 rounded-lg' : ''}`}>
              <div
                onMouseEnter={() => setHoveredItem('account')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <UserButton
                  afterSignOutUrl='/'
                  appearance={{ elements: { avatarBox: `w-6 h-6 transition-transform duration-200 ${hoveredItem === 'account' ? 'scale-110' : ''}` } }}
                />
              </div>
              {!isExpanded && hoveredItem === 'account' && <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs font-semibold text-white bg-black rounded shadow-lg whitespace-nowrap">ACCOUNT</span>}
            </div>
            {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">ACCOUNT</span>}
          </div>
        </SignedIn>
      </div>
    </aside>
  );
};