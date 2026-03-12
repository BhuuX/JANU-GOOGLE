import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillData {
  subject: string;
  A: number;
  fullMark: number;
}

const data: SkillData[] = [
  { subject: 'Cloud Arch', A: 120, fullMark: 150 },
  { subject: 'AI/ML', A: 98, fullMark: 150 },
  { subject: 'Security', A: 86, fullMark: 150 },
  { subject: 'DevOps', A: 99, fullMark: 150 },
  { subject: 'Frontend', A: 85, fullMark: 150 },
  { subject: 'Backend', A: 65, fullMark: 150 },
];

export const SkillRadarChart: React.FC = () => {
  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#f3f4f6" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#4285F4"
            fill="#4285F4"
            fillOpacity={0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
