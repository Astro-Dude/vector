import { useState } from 'react';
import { FaLinkedin } from 'react-icons/fa';

const Mentors = () => {
  const mentors = [
    // {
    //   id: 1,
    //   name: "Ankit Verma",
    //   role: "NSET Mentor & SST Computer Science Graduate",
    //   achievements: "Secured 96/100 in NSET, Software Engineer at Google, 2+ years mentoring experience",
    //   expertise: "Algorithms, Data Structures, Problem Solving",
    //   linkedin: "https://linkedin.com/in/ankit-verma",
    //   avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    // }
  ];

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

          {/* Mentors grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <div className="bg-white p-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100">
                          <img
                            src={mentor.avatar}
                            alt={mentor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <h3 className="font-bold text-gray-900 text-lg">{mentor.name}</h3>
                      <p className="text-blue-600 font-medium">{mentor.role}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-800">Achievements</h4>
                          <p className="text-sm text-gray-700">{mentor.achievements}</p>
                        </div>
                        
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <h4 className="text-sm font-semibold text-indigo-800">Expertise</h4>
                          <p className="text-sm text-gray-700">{mentor.expertise}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <a 
                          href={mentor.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaLinkedin className="mr-2" /> Connect on LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600">
              Our mentors have successfully navigated the NSET journey and are passionate about helping you succeed.
            </p>
            <a 
              href="/signup" 
              className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Register for Mentorship
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mentors; 