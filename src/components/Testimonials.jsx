import { useState } from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      content: "The practice tests were incredibly close to the actual NSET exam. The detailed explanations for each question helped me understand the concepts thoroughly. I got admitted to Scaler School of Technology's Computer Science program!",
      name: "Rahul Sharma",
      role: "NSET Score: 92/100, Batch of 2024",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      content: "The one-on-one mentorship sessions made all the difference in my preparation. My mentor, an alumnus of Scaler SoT, shared invaluable insights about the exam pattern and interview process that you won't find anywhere else.",
      name: "Priya Patel",
      role: "NSET Score: 89/100, Batch of 2024",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      id: 3,
      content: "I was struggling with the mathematical sections of NSET until I enrolled in Vector's test series. The topic-wise practice and live problem-solving sessions helped me overcome my weaknesses and score well above the cutoff.",
      name: "Arjun Singh",
      role: "NSET Score: 85/100, Batch of 2024",
      avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    },
    {
      id: 4,
      content: "From someone who had no idea how to prepare for NSET to securing admission at Scaler School of Technology - Vector's structured preparation path made this journey possible. The mock interviews prepared me perfectly for the selection process.",
      name: "Neha Gupta",
      role: "NSET Score: 94/100, Batch of 2024",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  return (
    <section id="testimonials" className="py-16 bg-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            NSET <span className="text-blue-600">Success Stories</span>
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Hear from students who successfully cracked the NSET exam and got into Scaler School of Technology.
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

          {/* Testimonial cards */}
          <div className="relative">
            <div className="overflow-hidden transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-xl p-6 md:p-10 relative z-10">
                <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-100">
                      <img
                        src={testimonials[activeIndex].avatar}
                        alt={testimonials[activeIndex].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                        <path d="M14.829 14.828a4.055 4.055 0 0 1-1.272.858 4.002 4.002 0 0 1-4.875-1.45l1.658-1.119a1.999 1.999 0 0 0 1.938.878c.36-.038.662-.231.91-.41l-1.411-1.411 1.414-1.414 4.242 4.242-1.414 1.414-1.19-1.19z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="md:w-2/3 md:pl-10">
                  <div className="mb-6">
                    <svg className="h-8 w-8 text-blue-500 mb-3" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                      {testimonials[activeIndex].content}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{testimonials[activeIndex].name}</h4>
                    <p className="text-blue-600">{testimonials[activeIndex].role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={prev}
                className="p-2 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 focus:outline-none"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full focus:outline-none transition-colors duration-300 ${
                      idx === activeIndex
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="p-2 rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 focus:outline-none"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 