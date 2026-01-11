import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});

interface MermaidChartProps {
    chart: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chartRef.current && chart) {
            // Clear previous content
            chartRef.current.innerHTML = '';

            const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

            try {
                mermaid.render(uniqueId, chart).then(({ svg }) => {
                    if (chartRef.current) {
                        chartRef.current.innerHTML = svg;
                    }
                });
            } catch (error) {
                console.error('Mermaid render error:', error);
            }
        }
    }, [chart]);

    return (
        <div className="mermaid-container w-full h-full flex items-center justify-center overflow-auto p-4 bg-zinc-900/50 rounded-2xl border border-white/5 shadow-inner">
            <div ref={chartRef} className="w-full h-full flex items-center justify-center" />
        </div>
    );
};

export default MermaidChart;
