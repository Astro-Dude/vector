import { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";

// Lazy load Spline to reduce initial bundle size
const Spline = lazy(() => import("@splinetool/react-spline"));

// Check if device can run Spline (WebGL, GPU, CPU capabilities)
function canRunSpline(): boolean {
  // Skip on mobile devices
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;

    // Check GPU - skip on integrated/low-end GPUs
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (/Intel|Mali|Adreno|PowerVR/i.test(renderer)) {
        return false;
      }
    }

    // Check CPU cores
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoadingSpline, setIsLoadingSpline] = useState(true);
  const [showSpline, setShowSpline] = useState(false);

  useEffect(() => {
    setShowSpline(canRunSpline());
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLoadingComplete = () => {
    setIsLoadingSpline(false);
  };

  return (
    <>
      {isLoadingSpline && showSpline && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}

      <div className="w-full bg-black">
        <Navbar />

        <section className="relative min-h-screen flex items-center justify-center bg-black">
          <div className="absolute inset-0">
            {showSpline ? (
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              }>
                <div className="w-full h-full [&>canvas]:w-full! [&>canvas]:h-full!">
                  <Spline
                    scene="https://prod.spline.design/Vr-k9WcXRKVzEPgF/scene.splinecode"
                  />
                </div>
              </Suspense>
            ) : (
              /* Lightweight CSS fallback for low-end devices */
              <div className="w-full h-full bg-black flex items-center justify-center">
                {/* Logo image behind text with glow */}
                <img
                  src="/src/assets/images/logo.png"
                  alt=""
                  className="absolute w-64 md:w-96 opacity-15 select-none pointer-events-none drop-shadow-[0_0_30px_rgba(255,255,255,1)]"
                />
                {/* VECTOR text with 3D glow effect */}
                <h1 className="logo relative z-10 text-7xl md:text-9xl font-bold bg-white bg-clip-text text-transparent tracking-widest select-none drop-shadow-[0_0_30px_rgba(255,255,255,1)]">
                  VECTOR
                </h1>
              </div>
            )}
          </div>
        </section>

        {/* Content Sections */}
        <section className="relative z-10 py-16 md:py-24 lg:py-32 px-4 md:px-8 bg-black">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16 text-gray-100 tracking-tight">
              Everything you need to{" "}
              <span className="text-green-400">Succeed</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-lg mb-4 md:mb-6 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                  Test Series
                </h4>
                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                  Master every NSET question type with practice tests that
                  mirror the real exam format.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-lg mb-4 md:mb-6 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                  Mentorship
                </h4>
                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                  Learn insider tips and strategies directly from Scaler
                  students who’ve aced the NSET exam.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-lg mb-4 md:mb-6 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                  Mock Interview
                </h4>
                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                  Experience a mock NSET AI interview with personalized feedback to
                  sharpen your performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mentors Section */}
        <section className="relative z-10 py-16 md:py-24 lg:py-32 px-4 md:px-8 bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-20">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
                Our Mentors
              </h3>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 lg:gap-8 pb-8 snap-x snap-mandatory scroll-smooth scrollbar-hide">
              {/* Mentor Cards - Black and White Theme */}
              {[
                {
                  name: "Shaurya Verma",
                  role: "Founder",
                  linkedin: "https://linkedin.com/in/astro-dude",
                  achievements: [
                    "Mentored 100+ students",
                    "SDE Intern at InterviewBit",
                    "Teaching Assistant at SST",
                  ],
                },
                {
                  name: "Krritin Keshan",
                  role: "Mentor",
                  linkedin: "linkedin.com/in/krritin-keshan/",
                  achievements: [
                    "Icpc Regionalist",
                    "Training Head @NLogN-The Cp Club of SST",
                    "Guardian @Leetcode (Top 1%)",
                  ],
                },
              ].map((mentor, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300 shrink-0 w-72 md:w-80 snap-center"
                >
                  <div className="h-32 md:h-40 bg-white/5"></div>
                  <div className="flex flex-col grow bg-black/50 pt-12 md:pt-16 pb-6 md:pb-8 px-4 md:px-6 relative -mt-12">
                    <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-700 overflow-hidden">
                        <div className="w-full h-full bg-white/10"></div>
                      </div>
                    </div>
                    <div className="text-center mt-6 md:mt-8 mb-4 md:mb-6">
                      <h4 className="text-lg md:text-xl font-bold text-white mb-1">
                        {mentor.name}
                      </h4>
                      <p className="text-white/60 text-xs md:text-sm">
                        {mentor.role}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-white/10 grow">
                      <h5 className="text-white/80 font-semibold mb-2 md:mb-3 text-xs md:text-sm">
                        ACHIEVEMENTS
                      </h5>
                      <ul className="space-y-1 md:space-y-2 text-white/60 text-xs md:text-sm">
                        {mentor.achievements.map((achievement, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-white/40">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a
                      href={mentor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 md:py-3 bg-white text-black hover:bg-white/90 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
