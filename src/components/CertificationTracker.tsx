import React from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

interface Step {
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
}

const steps: Step[] = [
  { title: 'Cloud Digital Leader', status: 'completed', description: 'Foundational knowledge of cloud concepts.' },
  { title: 'Associate Cloud Engineer', status: 'current', description: 'Deploying and managing applications on GCP.' },
  { title: 'Professional Cloud Architect', status: 'upcoming', description: 'Designing and planning cloud solution architecture.' },
  { title: 'Professional Data Engineer', status: 'upcoming', description: 'Building and maintaining data processing systems.' },
];

export const CertificationTracker: React.FC = () => {
  return (
    <div className="mt-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
      <div className="label-caps mb-8">Certification Roadmap</div>
      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-6 group">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-100 text-green-600' :
                step.status === 'current' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' :
                'bg-white border-2 border-gray-100 text-gray-200'
              }`}>
                {step.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-12 my-2 ${step.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`} />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h4 className={`font-bold text-sm ${step.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                {step.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {step.description}
              </p>
            </div>
            {step.status === 'current' && (
              <button className="self-center px-4 py-2 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 shadow-sm hover:shadow-md transition-all">
                Continue
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
