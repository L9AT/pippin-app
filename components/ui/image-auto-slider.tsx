"use client";

import React, { useEffect, useRef, useState } from 'react';

// SETTINGS
const PROJECT_ID = "xzkbbgbsnkocirthyuei";
const TOTAL_NFT_COUNT = 3333;
const BASE_URL = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/nfts/low/`;

interface PippinCardProps {
    name: string;
    url: string;
}

const PippinCard: React.FC<PippinCardProps> = ({ name, url }) => (
    <div className="flex-shrink-0 w-[220px] md:w-[280px] bg-white/5 border border-white/10 rounded-[20px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-105 hover:brightness-110 hover:border-[#b388ff] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] cursor-pointer group">
        <div className="aspect-square relative overflow-hidden bg-zinc-900">
            <img
                src={url}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                    // If image fails, hide the card to preserve seamless look
                    (e.target as HTMLImageElement).parentElement?.parentElement?.remove();
                }}
            />
        </div>
        <div className="p-5 text-center bg-black/40 border-t border-white/5">
            <span className="block font-['Outfit'] font-extrabold text-[0.95rem] text-white/90">{name}</span>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="flex-shrink-0 w-[220px] md:w-[280px] bg-white/5 border border-white/10 rounded-[20px] overflow-hidden">
        <div className="aspect-square bg-white/5 animate-pulse" />
        <div className="p-5 space-y-2">
            <div className="h-4 bg-white/10 rounded w-2/3 mx-auto animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-1/3 mx-auto animate-pulse" />
        </div>
    </div>
);

export const ImageAutoSlider: React.FC = () => {
    const [pippins, setPippins] = useState<{ name: string, url: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs for interaction
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const xPos = useRef(0);
    const velocity = useRef(0);
    const lastX = useRef(0);
    const lastTime = useRef(0);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const dragStartX = useRef(0);
    const isHovered = useRef(false);

    useEffect(() => {
        // Init logic
        const allIds = Array.from({ length: TOTAL_NFT_COUNT }, (_, i) => i + 1);
        for (let i = allIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
        }
        const selectedIds = allIds.slice(0, 16);
        const generatedPippins = selectedIds.map(id => ({
            name: `Pippin #${String(id).padStart(4, '0')}`,
            url: `${BASE_URL}${id}.png`
        }));
        setPippins(generatedPippins);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (loading || pippins.length === 0) return;

        let rafId: number;
        const baseSpeed = 1.25;
        const friction = 0.95;

        const loop = () => {
            if (!isDragging.current) {
                if (Math.abs(velocity.current) > 0.1) {
                    xPos.current += velocity.current;
                    velocity.current *= friction;
                } else {
                    velocity.current = 0;
                    if (!isHovered.current) {
                        xPos.current -= baseSpeed;
                    }
                }

                const track = trackRef.current;
                if (track) {
                    const halfWidth = track.scrollWidth / 2;
                    if (xPos.current <= -halfWidth) {
                        xPos.current += halfWidth;
                    } else if (xPos.current > 0) {
                        xPos.current -= halfWidth;
                    }
                    track.style.transform = `translateX(${xPos.current}px)`;
                }
            }
            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [loading, pippins]);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.pageX;
        dragStartX.current = xPos.current;
        lastX.current = e.pageX;
        lastTime.current = Date.now();
        velocity.current = 0;
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (!isDragging.current) return;

            const now = Date.now();
            const dt = now - lastTime.current;
            if (dt > 0) {
                const dx = e.pageX - lastX.current;
                velocity.current = dx;
                lastX.current = e.pageX;
                lastTime.current = now;
            }

            const walk = (e.pageX - startX.current) * 1.5;
            xPos.current = dragStartX.current + walk;
            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(${xPos.current}px)`;
            }
        };

        const handlePointerUp = () => {
            isDragging.current = false;
            if (containerRef.current) containerRef.current.style.cursor = 'grab';
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        velocity.current -= e.deltaY * 0.5;
        if (trackRef.current) {
            trackRef.current.style.transform = `translateX(${xPos.current}px)`;
        }
    };

    // Duplicate for loop
    const displayItems = [...pippins, ...pippins];

    return (
        <div className="w-full overflow-hidden relative py-12 select-none group" ref={containerRef}
            onPointerDown={handlePointerDown}
            onMouseEnter={() => { isHovered.current = true; }}
            onMouseLeave={() => { isHovered.current = false; }}
            onWheel={handleWheel}
            style={{ cursor: 'grab' }}
        >
            {/* Edge Shadow Masks */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#060913] via-transparent to-[#060913] opacity-90" />

            <div className="slider-container overflow-hidden">
                <div
                    ref={trackRef}
                    className="flex gap-4 md:gap-6 w-max will-change-transform"
                >
                    {loading ? (
                        Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        displayItems.map((p, i) => (
                            <PippinCard key={`${p.url}-${i}`} {...p} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageAutoSlider;
