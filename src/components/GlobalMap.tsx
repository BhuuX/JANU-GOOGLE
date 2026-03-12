import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  type: 'event' | 'gdg' | 'office';
}

const points: MapPoint[] = [
  { lat: 37.422, lng: -122.084, label: 'Googleplex', type: 'office' },
  { lat: 51.507, lng: -0.127, label: 'London Office', type: 'office' },
  { lat: 1.352, lng: 103.819, label: 'Singapore Hub', type: 'office' },
  { lat: 28.613, lng: 77.209, label: 'New Delhi GDG', type: 'gdg' },
  { lat: -33.868, lng: 151.209, label: 'Sydney Event', type: 'event' },
  { lat: -23.550, lng: -46.633, label: 'São Paulo GDG', type: 'gdg' },
  { lat: 35.676, lng: 139.650, label: 'Tokyo Office', type: 'office' },
];

export const GlobalMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;

    svg.selectAll("*").remove();

    const projection = d3.geoNaturalEarth1()
      .scale(140)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load world data
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then((data: any) => {
      // Draw the map
      svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#f3f4f6")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 0.5);

      // Add points
      svg.selectAll("circle")
        .data(points)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lng, d.lat])![0])
        .attr("cy", d => projection([d.lng, d.lat])![1])
        .attr("r", 4)
        .attr("fill", d => {
          if (d.type === 'office') return '#4285F4'; // Google Blue
          if (d.type === 'gdg') return '#34A853';    // Google Green
          return '#EA4335';                          // Google Red
        })
        .attr("class", "cursor-pointer hover:scale-150 transition-transform")
        .append("title")
        .text(d => d.label);
    });
  }, []);

  return (
    <div className="w-full bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Global Ecosystem Presence</h3>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Real-time Node Distribution</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Offices</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold uppercase text-gray-400">GDGs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Events</span>
          </div>
        </div>
      </div>
      <div className="relative aspect-[2/1] w-full">
        <svg 
          ref={svgRef} 
          viewBox="0 0 800 400" 
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
