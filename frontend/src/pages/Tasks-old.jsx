import React from 'react';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const Tasks = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-cyan-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-morphing"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-2xl animate-float" style={{animationDelay: '1.5s'}}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-cyan-600/30 rounded-3xl p-12 text-white backdrop-blur-2xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-cyan-400/10 animate-morphing"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl animate-float"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-rainbow">
                  Tasks 📋
                </h1>
                <p className="text-white/80 text-2xl font-medium animate-glow">
                  Manage your tasks and achieve your goals ✨
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center animate-glow shadow-2xl shadow-purple-500/50">
                  <ClipboardDocumentListIcon className="w-16 h-16 text-white animate-sparkle" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-col sm:flex-row gap-6">
          <button className="group relative flex items-center justify-center px-8 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-morphing"></div>
            <PlusIcon className="relative z-10 w-7 h-7 mr-3 group-hover:animate-wiggle" />
            <span className="relative z-10">Create Task ✨</span>
          </button>
          <button className="group relative flex items-center justify-center px-8 py-5 bg-white/10 backdrop-blur-2xl border-2 border-white/30 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 hover:bg-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CheckCircleIcon className="relative z-10 w-7 h-7 mr-3 group-hover:animate-wiggle" />
            <span className="relative z-10">View Completed 🎉</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-cyan-400/10 animate-morphing"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl animate-float"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-glow shadow-2xl shadow-purple-500/50">
                <RocketLaunchIcon className="w-16 h-16 text-white animate-sparkle" />
              </div>
              
              <h3 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-rainbow">
                Task Management System 🚀
              </h3>
              
              <div className="text-xl text-white/80 font-medium leading-relaxed">
                <p className="mb-4 animate-glow">
                  Your powerful task management features are coming soon! ✨
                </p>
                <p className="mb-6">
                  Get ready to organize, prioritize, and accomplish your goals like never before! 🎯
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
                    <h4 className="text-lg font-bold text-white mb-2">Smart Organization</h4>
                    <p className="text-white/70">Intelligent task categorization and prioritization</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <ClockIcon className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-bounce" style={{animationDelay: '0.5s'}} />
                    <h4 className="text-lg font-bold text-white mb-2">Time Tracking</h4>
                    <p className="text-white/70">Advanced time management and productivity insights</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <SparklesIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-bounce" style={{animationDelay: '1s'}} />
                    <h4 className="text-lg font-bold text-white mb-2">Team Collaboration</h4>
                    <p className="text-white/70">Seamless task sharing and team coordination</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
