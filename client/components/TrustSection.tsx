import React from "react";
import { Users, Headphones, Shield } from "lucide-react";

export const TrustSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header with Trust Indicators */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium text-sm">Trusted by millions worldwide</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Trusted by 50M+ Travelers
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Real reviews from verified travelers
          </p>
          
          {/* Trust Score Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-100">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-4xl font-bold text-gray-900">4.9</span>
            </div>
            
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-lg">Excellent</div>
              <div className="text-gray-600 text-sm">Based on 50,000+ reviews on</div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Trustpilot</div>
                <span className="text-green-600 font-medium">★★★★★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Support Banner */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white py-6 px-8 rounded-2xl inline-block shadow-xl">
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">24/7 Customer Support</div>
                <div className="text-blue-100">Live Chat & Call Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Methods - Enhanced Grid */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe, Verified, and Instant Confirmations</h3>
            <p className="text-gray-600">Backed by real humans</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">Live Chat</div>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-2xl">📞</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm">Phone Call</div>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-2xl">✉️</span>
              </div>
              <div className="font-semibold text-gray-900 text-sm">Email</div>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">24/7 Support</div>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform duration-200 md:col-span-1 col-span-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">Instant Confirmations</div>
            </div>
          </div>
        </div>

        {/* Customer Testimonials - Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Priya Sharma</div>
                <div className="text-gray-500 text-sm">Marketing Manager</div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-gray-600 text-sm ml-2">5.0</span>
            </div>
            
            <blockquote className="text-gray-700 leading-relaxed italic">
              "Saved ₹15,000 on my Dubai trip! The bargaining feature is amazing. Got business class for economy price."
            </blockquote>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Rohit Kumar</div>
                <div className="text-gray-500 text-sm">Software Engineer</div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-gray-600 text-sm ml-2">5.0</span>
            </div>
            
            <blockquote className="text-gray-700 leading-relaxed italic">
              "Got suite upgrade in Singapore hotel using Bargain™. Faredown is revolutionary! Customer service is excellent."
            </blockquote>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Anjali Patel</div>
                <div className="text-gray-500 text-sm">Product Designer</div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-gray-600 text-sm ml-2">5.0</span>
            </div>
            
            <blockquote className="text-gray-700 leading-relaxed italic">
              "Easy booking process and instant confirmations. Saved on both flights and hotels. Will use again!"
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
