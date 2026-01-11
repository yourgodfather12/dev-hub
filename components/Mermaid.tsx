
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
});

interface MermaidProps {
    chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && chart) {
            try {
                ref.current.removeAttribute('data-processed');
                // Clear previous content
                ref.current.innerHTML = chart;
                mermaid.contentLoaded();
            } catch (e) {
                console.error('Mermaid rendering failed:', e);
            }
        }
    }, [chart]);

    return (
        <div className="mermaid-container w-full overflow-auto flex justify-center py-4 bg-zinc-900/30 rounded-2xl border border-white/5">
            <div className="mermaid" ref={ref}>
                {chart}
            </div>
        </div>
    );
};

export default Mermaid;
