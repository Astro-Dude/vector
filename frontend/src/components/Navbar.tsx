import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const getStartedBtnRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  // Mouse movement effect for magnetic buttons (only when not authenticated)
  useEffect(() => {
    if (isAuthenticated) return;

    const handleMouseMove = (e: MouseEvent) => {
      const loginBtn = loginBtnRef.current;
      const getStartedBtn = getStartedBtnRef.current;
      
      if (!loginBtn || !getStartedBtn) return;
      
      const getButtonDistance = (button: HTMLButtonElement) => {
        const rect = button.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        const buttonCenterY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - buttonCenterX;
        const distanceY = e.clientY - buttonCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        return { distance, distanceX, distanceY };
      };
      
      const loginDistance = getButtonDistance(loginBtn);
      const getStartedDistance = getButtonDistance(getStartedBtn);
      
      const magnetRadius = 80;
      
      
      const distanceDiff = Math.abs(loginDistance.distance - getStartedDistance.distance);
      const switchThreshold = 20; 
      
      let targetButton: HTMLButtonElement | null = null;
      let targetDistance: { distance: number; distanceX: number; distanceY: number } | null = null;
      
      if (loginDistance.distance < magnetRadius && getStartedDistance.distance < magnetRadius) {
        if (distanceDiff > switchThreshold) {
          targetButton = loginDistance.distance < getStartedDistance.distance ? loginBtn : getStartedBtn;
          targetDistance = loginDistance.distance < getStartedDistance.distance ? loginDistance : getStartedDistance;
        }
      } else if (loginDistance.distance < magnetRadius) {
        targetButton = loginBtn;
        targetDistance = loginDistance;
      } else if (getStartedDistance.distance < magnetRadius) {
        targetButton = getStartedBtn;
        targetDistance = getStartedDistance;
      }
      
      if (targetButton && targetDistance) {
        const power = (magnetRadius - targetDistance.distance) / magnetRadius;
        const moveX = targetDistance.distanceX * power * 0.8;
        const moveY = targetDistance.distanceY * power * 0.8;
        
        targetButton.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        const otherButton = targetButton === loginBtn ? getStartedBtn : loginBtn;
        otherButton.style.transform = 'translate(0, 0)';
      } else {
        loginBtn.style.transform = 'translate(0, 0)';
        getStartedBtn.style.transform = 'translate(0, 0)';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAuthenticated]);

  return (
    <nav className="fixed top-3 md:top-6 left-1/2 -translate-x-1/2 z-1000 w-[95%] max-w-[1400px]">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-4xl px-4 md:px-8 py-3 md:py-4 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="navbar-brand">
          <button
            onClick={() => navigate('/home')}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:drop-shadow-[0_4px_6px_rgba(255,255,255,0.3)]"
          >
            <h1 className={`logo m-0 text-2xl md:text-3xl font-bold bg-white bg-clip-text text-transparent tracking-wide`}>
              Vector
            </h1>
          </button>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ProfileAvatar
                  src={user?.profilePicture}
                  name={user?.firstName}
                  email={user?.email}
                  size="sm"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.firstName || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate('/interview/history');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Interview Results
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                ref={loginBtnRef}
                onClick={login}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-[0.95rem] font-medium cursor-pointer transition-all duration-200 bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/30"
              >
                Login
              </button>
              <button
                ref={getStartedBtnRef}
                onClick={login}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-[0.95rem] font-medium cursor-pointer transition-all duration-200 border-none bg-white text-black hover:bg-white/90 hover:scale-105"
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
