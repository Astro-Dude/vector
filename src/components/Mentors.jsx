import { useState } from 'react';
import { FaLinkedin } from 'react-icons/fa';
// Import images
import shaurya from '../assets/images/shaurya.jpg';
import hardik from '../assets/images/hardik.jpg';
import rudhar from '../assets/images/rudhar.jpg';
import krritin from '../assets/images/krritin.jpg';
// Import other avatars similarly

const Mentors = () => {
  const mentors = [
    {
      id: 1,
      name: "Shaurya Verma (Founder)",
      role: "Guided 25+ aspirants for NSET",
      achievements: "Offered 20% scholorship at SST, Member @NlogN-Club-SST, 3⭐ @CodeChef",
      linkedin: "https://www.linkedin.com/in/astro-dude/",
      avatar: shaurya,
    },
    {
      id: 2,
      name: "Rudhar Bajaj (Co-Founder)",
      role: "",
      achievements: "Offered 20% scholorship at SST, AIR 24k in JEE Advanced, AIR 5 in NSTSE",
      linkedin: "https://www.linkedin.com/in/rudhar-bajaj/",
      avatar: rudhar,
    },
    {
      id: 3,
      name: "Hardik Jumnani",
      role: "",
      achievements: "Offered 25% scholorship at SST, President at SST ",
      linkedin: "https://www.linkedin.com/in/hardik-jumnani/",
      avatar: hardik,
    },
    {
      id: 4,
      name: "Krritin Keshan",
      role: "",
      achievements: "Core @ NlogN-Club-SST, Specialist @Codeforces, 3⭐ @CodeChef",
      linkedin: "https://www.linkedin.com/in/krritin-keshan/",
      avatar: krritin,
    }
  ];

  // Function to split achievements into array of points
  const getAchievementPoints = (achievementsText) => {
    return achievementsText.split(', ');
  };

  // Function to get initials for fallback avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <section id="mentors" className="py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Our <span className="text-blue-600">Mentors</span>
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Learn from experienced SST students who've excelled in the NSET exam and are ready to guide you to success.
          </p>
        </div>

        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 bg-blue-50 rounded-full opacity-30 blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2">
            <div className="w-64 h-64 bg-indigo-50 rounded-full opacity-30 blur-3xl"></div>
          </div>

          {/* Horizontal scrolling container for mentors */}
          <div className="relative z-10 overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex space-x-6 pl-2 pr-8 py-4 min-w-max">
              {mentors.map((mentor) => (
                <div 
                  key={mentor.id} 
                  className="flex-shrink-0 w-80 bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100"
                >
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center relative">
                    {/* Center and enlarge the image */}
                    <div className="absolute transform translate-y-1/2">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        {mentor.avatar ? (
                          <img
                            src={mentor.avatar}
                            alt={mentor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold">
                            {getInitials(mentor.name)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-20 px-6 pb-6">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-gray-900 text-xl">{mentor.name}</h3>
                      {mentor.role && (
                        <p className="text-blue-600 font-medium text-sm">
                          {mentor.role}
                        </p>
                      )}
                    </div>
                    
                    <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Achievements</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {getAchievementPoints(mentor.achievements).map((point, index) => (
                          <li key={index} className="text-gray-600">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="text-center">
                      <a 
                        href={mentor.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaLinkedin className="mr-2" /> Connect on LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            <span>← Scroll to see more mentors →</span>
          </div>
          
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-6">
              Our mentors have successfully navigated the NSET journey and are passionate about helping you succeed.
            </p>
            <a 
              href="/signup" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Register for Mentorship
            </a>
          </div>
        </div>
      </div>
      
      {/* CSS for hiding scrollbar but keeping functionality */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </section>
  );
};

export default Mentors; 