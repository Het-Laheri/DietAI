import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 border-8 md:border-[16px] border-stone-100/50">
      <div className="text-center max-w-2xl px-4">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-brand-900 text-brand-50 rounded-full flex items-center justify-center">
             <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-serif font-bold text-stone-900 tracking-tight">NutriSnap.</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.1] mb-8">
          Clinical nutrition,<br/> <span className="italic text-brand-700">elevated.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-stone-500 mb-12 max-w-lg mx-auto leading-relaxed font-sans">
          The precise, all-in-one platform for professional dieticians and their patients to manage meal plans seamlessly.
        </p>
        
        <div className="flex justify-center">
          <Link to="/login" className="px-10 py-4 bg-stone-900 text-stone-50 font-sans tracking-widest text-sm uppercase font-bold rounded-full hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto text-center">
            Sign In to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
