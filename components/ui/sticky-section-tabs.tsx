import React from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

export interface StickyTabProps {
    title: string;
    content: React.ReactNode;
    imageSrc: string;
    mediaType?: "image" | "video";
    bgImageSrc?: string;
    mediaTitle?: string;
    mediaDate?: string;
    scrollToExpand?: string;
}

export interface StickyTabsProps {
    tabs: StickyTabProps[];
    className?: string;
}

export default function StickyTabs({ tabs, className }: StickyTabsProps) {
    return (
        <div className={clsx("w-full bg-[#0a0a0a]", className)}>
            {tabs.map((tab, index) => (
                <section
                    key={index}
                    className="w-full max-w-[1200px] mx-auto px-10 py-[160px] min-h-[100vh] grid grid-cols-1 md:grid-cols-[420px_1fr] gap-20 items-start"
                >
                    <div className="w-full md:sticky top-[120px] self-start z-10 max-w-[420px]">
                        <h2 className="font-display text-[clamp(36px,3vw,52px)] font-extrabold uppercase leading-[1.1] tracking-tight text-[#f5f5f7] m-0 whitespace-nowrap [text-wrap:balance]">
                            {tab.title}
                        </h2>
                    </div>

                    {/* RIGHT COLUMN → paragraph text + media */}
                    <div className="w-full min-w-0 flex flex-col gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 80 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="text-left font-body text-[18px] text-white/70 leading-[1.7] max-w-[680px]"
                        >
                            {tab.content}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 80 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full mt-10"
                        >
                            <ScrollExpandMedia
                                mediaType={tab.mediaType || (tab.imageSrc?.endsWith('.mp4') ? "video" : "image")}
                                mediaSrc={tab.imageSrc}
                                bgImageSrc={tab.bgImageSrc}
                                title={tab.mediaTitle}
                                date={tab.mediaDate}
                                scrollToExpand={tab.scrollToExpand}
                            />
                        </motion.div>
                    </div>
                </section>
            ))}
        </div>
    );
}
