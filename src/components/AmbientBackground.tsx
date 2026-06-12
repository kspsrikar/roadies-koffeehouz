import React, { useState, useEffect } from 'react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  { type: 'image', url: '/storefront.jpg' },
  { type: 'image', url: '/pizza.jpg' },
  { type: 'image', url: '/burgers.jpg' },
  { type: 'image', url: '/calzone.jpg' },
  { type: 'image', url: '/tacos.jpg' }
];

export const AmbientBackground: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(DEFAULT_MEDIA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [fade, setFade] = useState(true);

  // Scan public directory/server for video uploads or fallback to defaults
  useEffect(() => {
    // Check if custom video exists or is registered
    const checkCustomMedia = async () => {
      try {
        const res = await fetch('/db.json');
        if (res.ok) {
          const db = await res.json();
          if (db.settings?.backgroundVideos && db.settings.backgroundVideos.length > 0) {
            const customList = db.settings.backgroundVideos.map((url: string) => ({
              type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'video' : 'image',
              url
            }));
            setMediaList([...customList, ...DEFAULT_MEDIA]);
          }
        }
      } catch (e) {
        console.log("No custom db settings found, using default visual assets");
      }
    };
    checkCustomMedia();
  }, []);

  useEffect(() => {
    if (mediaList.length <= 1) return;

    // Check if current item is video; videos will loop or play and advance on end
    const currentMedia = mediaList[currentIndex];
    if (currentMedia.type === 'video') {
      // For videos, we rely on the video onEnded event (or standard duration if not supported)
      return;
    }

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPrevIndex(currentIndex);
        setCurrentIndex((prev) => (prev + 1) % mediaList.length);
        setFade(true);
      }, 800); // fade out duration
    }, 7000); // time per slide

    return () => clearInterval(interval);
  }, [currentIndex, mediaList]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a'
    }}>
      {/* Background Media Layers */}
      {mediaList.map((item, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrev = idx === prevIndex;
        const isActive = isCurrent || isPrev;

        if (!isActive) return null;

        return (
          <div
            key={item.url + idx}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isCurrent ? (fade ? 0.35 : 0) : 0.35,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: isCurrent ? 2 : 1
            }}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                autoPlay
                muted
                loop
                playsInline
                onEnded={() => {
                  setFade(false);
                  setTimeout(() => {
                    setPrevIndex(currentIndex);
                    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
                    setFade(true);
                  }, 800);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <img
                src={item.url}
                alt="Ambient Background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}
          </div>
        );
      })}

      {/* Dark Ambient Glass Overlay for premium feel & maximum content contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(10, 10, 10, 0.7) 0%, rgba(5, 5, 5, 0.95) 100%)',
        backdropFilter: 'blur(35px) saturate(150%)',
        zIndex: 3
      }} />
    </div>
  );
};
