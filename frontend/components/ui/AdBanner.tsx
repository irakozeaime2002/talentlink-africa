"use client";
import { useEffect, useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

export interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel: string;
  dueDate?: string;
  badge?: string;
}

export default function AdBanner({ ads }: { ads: Ad[] }) {
  const [current, setCurrent] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % ads.length);
        setTimeout(() => setIsSliding(false), 50);
      }, 600);
    }, 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  const slide = (dir: "next" | "prev") => {
    if (isSliding) return;
    setIsSliding(true);
    setTimeout(() => {
      setCurrent((c) => dir === "next" ? (c + 1) % ads.length : (c - 1 + ads.length) % ads.length);
      setTimeout(() => setIsSliding(false), 50);
    }, 600);
  };

  if (ads.length === 0) return null;

  const ad = ads[current];
  const isExpired = ad.dueDate && new Date(ad.dueDate) < new Date();

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, var(--accent) 60%, #1a0533 100%)" }}>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 animate-pulse"
          style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)", animationDelay: "1s" }} />
      </div>

      <div key={current} className={`relative z-10 p-4 transition-all duration-600 ease-in-out ${isSliding ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>

        {/* Badge */}
        {ad.badge && (
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white mb-3">
            {ad.badge}
          </span>
        )}

        {/* Image */}
        {ad.imageUrl && (
          <img src={ad.imageUrl} alt={ad.title}
            className="w-full h-32 rounded-xl object-cover mb-3 border border-white/10 shadow" />
        )}

        {/* Title & description */}
        <p className="font-bold text-white text-sm leading-snug mb-1">{ad.title}</p>
        <p className="text-white/70 text-xs leading-relaxed mb-3">{ad.description}</p>

        {/* CTA */}
        {ad.linkUrl && (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full bg-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition shadow-md"
            style={{ color: "var(--accent)" }}>
            {ad.linkLabel} <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Dots + nav */}
      {ads.length > 1 && (
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex gap-1">
            {ads.map((_, i) => (
              <button key={i} onClick={() => {
                if (i !== current && !isSliding) {
                  setIsSliding(true);
                  setTimeout(() => {
                    setCurrent(i);
                    setTimeout(() => setIsSliding(false), 50);
                  }, 600);
                }
              }}
                className={`rounded-full transition-all duration-500 ${i === current ? "w-6 h-1.5 bg-white shadow-lg" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"}`} />
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => slide("prev")} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
              <ChevronLeft size={12} />
            </button>
            <button onClick={() => slide("next")} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
