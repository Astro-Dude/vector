import { useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, login } = useAuth();
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const getStartedBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <nav className="fixed top-3 md:top-6 left-1/2 -translate-x-1/2 z-1000 w-[95%] max-w-[1400px]">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-4xl px-4 md:px-8 py-3 md:py-4 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="navbar-brand">
          <h1 className={`logo m-0 text-2xl md:text-3xl font-bold bg-white bg-clip-text text-transparent tracking-wide`}>
            Vector
          </h1>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          {isAuthenticated ? (
            <>
              <span className="px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-[0.95rem] font-medium text-white">
                Welcome, {user?.displayName?.split(' ')[0]}
              </span>
              <button
                ref={loginBtnRef}
                onClick={() => window.location.href = '/profile'}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-[0.95rem] font-medium cursor-pointer transition-all duration-200 bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/30"
              >
                Profile
              </button>
            </>
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
