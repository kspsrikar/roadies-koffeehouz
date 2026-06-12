"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionValue } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, X, Plus, Minus, ShoppingBag } from "lucide-react";

// Simple class merger helper for Vite/React compatibility
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

// ===== Types and Interfaces =====
export interface iMenuItemTestimonial {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  profileImage: string; // The item's primary image
  popular?: boolean;
}

interface iCarouselProps {
  items: React.ReactElement[];
  initialScroll?: number;
}

// ===== Custom Hooks =====
const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

// ===== Components =====
const Carousel = ({ items, initialScroll = 0 }: iCarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384;
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      // Small timeout to allow content layout calculation
      const timer = setTimeout(checkScrollability, 100);
      return () => clearTimeout(timer);
    }
  }, [initialScroll, items]);

  return (
    <div className="relative w-full mt-4">
      <div
        className="flex w-full overflow-x-auto scroll-smooth [scrollbar-width:none] py-4"
        ref={carouselRef}
        onScroll={checkScrollability}
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className={cn(
            "flex flex-row justify-start gap-4 px-4",
            "max-w-5xl mx-auto",
          )}
        >
          {items.map((item, index) => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.4,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  },
                }}
                key={item.key || `card-${index}`}
                className="flex-shrink-0"
              >
                {React.cloneElement(item as any, {
                  onCardClose: () => {
                    return handleCardClose(index);
                  },
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center md:justify-end gap-3 mt-4 px-4">
        <button
          className="h-12 w-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center disabled:opacity-30 hover:bg-[#f59e0b]/25 transition-all duration-200 cursor-pointer"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
        >
          <ArrowLeft className="h-6 w-6 text-[#f59e0b]" />
        </button>
        <button
          className="h-12 w-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center disabled:opacity-30 hover:bg-[#f59e0b]/25 transition-all duration-200 cursor-pointer"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
        >
          <ArrowRight className="h-6 w-6 text-[#f59e0b]" />
        </button>
      </div>
    </div>
  );
};

const TestimonialCard = ({
  testimonial,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1528458965990-428de4b1cb0d?q=80&w=3129&auto=format&fit=crop",
  cartQuantity = 0,
  onAdd = () => {},
  onRemove = () => {},
  themeColor = "var(--primary)",
}: {
  testimonial: iMenuItemTestimonial;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
  cartQuantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  themeColor?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => {
    setIsExpanded(true);
  };
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as any });
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  // Categories styling mapping
  const badgeColors: Record<string, string> = {
    coffee: "rgba(245, 158, 11, 0.15)",
    drinks: "rgba(59, 130, 246, 0.15)",
    pizza: "rgba(239, 68, 68, 0.15)",
    pasta: "rgba(16, 185, 129, 0.15)",
    sides: "rgba(139, 92, 246, 0.15)",
    dessert: "rgba(236, 72, 153, 0.15)",
  };

  const textColors: Record<string, string> = {
    coffee: "#f59e0b",
    drinks: "#3b82f6",
    pizza: "#ef4444",
    pasta: "#10b981",
    sides: "#8b5cf6",
    dessert: "#ec4899",
  };

  const itemColor = textColors[testimonial.category] || themeColor;
  const itemBgColor = badgeColors[testimonial.category] || "rgba(255,255,255,0.05)";

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/80 backdrop-blur-md h-full w-full fixed inset-0"
              onClick={handleCollapse}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              ref={containerRef}
              className="max-w-2xl w-full bg-[#1c1c1f] border border-[#27272a] h-auto max-h-[85vh] overflow-y-auto z-[60] p-6 md:p-8 rounded-3xl relative text-left shadow-2xl"
            >
              <button
                className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] transition-colors cursor-pointer"
                onClick={handleCollapse}
              >
                <X className="h-5 w-5 text-white" />
              </button>
              
              {/* Category Badge */}
              <span 
                style={{ backgroundColor: itemBgColor, color: itemColor }}
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4"
              >
                {testimonial.category}
              </span>

              {/* Title & Price */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                  {testimonial.name}
                </h3>
                <span style={{ color: itemColor }} className="text-2xl md:text-3xl font-black shrink-0">
                  ₹{testimonial.price}
                </span>
              </div>

              {/* Image Banner */}
              {testimonial.profileImage && (
                <div className="w-full h-56 rounded-2xl overflow-hidden mb-6 border border-[#27272a]">
                  <img 
                    src={testimonial.profileImage} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 font-medium">
                <Quote className="h-6 w-6 opacity-30 mb-2" style={{ color: itemColor }} />
                {testimonial.description}
              </div>

              {/* Order / Add to Cart Action */}
              <div className="flex items-center justify-between border-t border-[#27272a] pt-5 mt-4">
                <span className="text-sm text-gray-400">Add to dining table order</span>
                
                {cartQuantity > 0 ? (
                  <div 
                    style={{ backgroundColor: itemColor }}
                    className="flex items-center rounded-full p-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      className="h-10 w-10 text-black font-extrabold flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-black text-black px-4 min-w-[20px] text-center text-lg">
                      {cartQuantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                      }}
                      className="h-10 w-10 text-black font-extrabold flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd();
                    }}
                    style={{ backgroundColor: itemColor }}
                    className="px-6 py-3 rounded-full text-black font-black flex items-center gap-2 hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingBag size={16} /> Add to Order
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleExpand}
        className="text-left w-full cursor-pointer focus:outline-none"
        whileHover={{
          rotateX: 1.5,
          rotateY: 1.5,
          rotate: index % 2 === 0 ? 1 : -1,
          scale: 1.015,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <div
          style={{
            border: `1px solid var(--border-color)`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.3)`
          }}
          className="rounded-3xl bg-[#1c1c1f] h-[480px] w-72 md:w-80 overflow-hidden flex flex-col items-center justify-between p-5 relative z-10"
        >
          {/* Subtle textured grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-3xl" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 11%)', backgroundSize: '12px 12px' }} />

          {/* Category Tag */}
          <div className="w-full flex justify-between items-center z-10">
            <span 
              style={{ backgroundColor: itemBgColor, color: itemColor }}
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
            >
              {testimonial.category}
            </span>
            {testimonial.popular && (
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black">
                POPULAR
              </span>
            )}
          </div>

          {/* Item Image */}
          <div 
            style={{ borderColor: `rgba(255,255,255,0.08)` }}
            className="w-40 h-40 md:w-44 md:h-44 overflow-hidden rounded-full border-[4px] aspect-[1/1] shrink-0 relative shadow-inner z-10"
          >
            <img
              className="block w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              src={testimonial.profileImage || backgroundImage}
              alt={testimonial.name}
              loading="lazy"
            />
          </div>

          {/* Item Title & Price */}
          <div className="text-center w-full z-10 px-2">
            <h4 className="text-white text-lg font-black tracking-tight leading-tight lowercase">
              {testimonial.name}
            </h4>
            <span style={{ color: itemColor }} className="text-xl font-black block mt-1">
              ₹{testimonial.price}
            </span>
            <p className="text-gray-400 text-xs mt-2 line-clamp-3 leading-relaxed font-medium">
              {testimonial.description}
            </p>
          </div>

          {/* Order Action Footer on Card */}
          <div className="w-full flex justify-between items-center pt-4 border-t border-[#27272a] z-10">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Insta-Order</span>
            {cartQuantity > 0 ? (
              <div 
                style={{ backgroundColor: itemColor }}
                className="flex items-center rounded-full p-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onRemove}
                  className="h-7 w-7 text-black font-extrabold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-black px-2 text-sm min-w-[12px] text-center">
                  {cartQuantity}
                </span>
                <button
                  onClick={onAdd}
                  className="h-7 w-7 text-black font-extrabold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                style={{ backgroundColor: itemColor }}
                className="h-8 w-8 rounded-full text-black font-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.button>
    </>
  );
};

// Export the components
export { Carousel, TestimonialCard };
