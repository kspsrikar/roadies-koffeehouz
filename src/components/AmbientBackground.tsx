import React, { useState, useEffect } from 'react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  { type: 'video', url: 'https://rr5---sn-2ocvhc-5n.googlevideo.com/videoplayback?expire=1781275519&ei=X_8rapyaFpKMpNoPtf_R8Ak&ip=2405:201:30:b817:7dea:bc36:9d10:fd8a&id=d4c78938c4d9b789&itag=18&source=contrib_service_geo_ugc&begin=0&requiressl=yes&xpc=EghoqJzIP3oBAQ==&met=1781268319,&mh=JZ&mm=32&mn=sn-2ocvhc-5n&ms=su&mv=m&mvi=5&pl=45&rms=su,su&sc=yes&susc=gugc&app=fife&ic=1061&eaua=GrKwNU3Tdck&pcm2=yes&mime=video/mp4&vprv=1&rqh=1&dur=17.136&lmt=1728674529384358&mt=1781267823&txp=0000224&sparams=expire,ei,ip,id,itag,source,requiressl,xpc,susc,app,ic,eaua,pcm2,mime,vprv,rqh,dur,lmt&sig=AHEqNM4wRgIhAPtehA1QF8jzedv5lGrJYgFIi1KwiLycch3Typ31AVQoAiEA45zhYURbcYpw0VP-0ElQa7zdePmcyzW-5uh9F1Fh7qY=&lsparams=met,mh,mm,mn,ms,mv,mvi,pl,rms,sc&lsig=APaTxxMwRAIgOxWES9OPklwwnzUEo9ccxwuNII0S07vXBy16bJqWUb8CIE-MU3QsJhwM94vzfb6RyImakbNzJJCKNrgjjAnKULjn' },
  { type: 'video', url: 'https://rr2---sn-cvh76nle.googlevideo.com/videoplayback?expire=1781275320&ei=mP4raoDlNuG_4t4P5ZHNsAk&ip=2405:201:30:b817:7dea:bc36:9d10:fd8a&id=80f0d21982e10acb&itag=18&source=contrib_service_geo_ugc&begin=0&requiressl=yes&xpc=EghoqJzIP3oBAQ==&rms=su,su&sc=yes&susc=gugc&app=fife&ic=1061&eaua=GrKwNU3Tdck&pcm2=yes&mime=video/mp4&vprv=1&rqh=1&dur=9.520&lmt=1728676182181536&txp=0000224&sparams=expire,ei,ip,id,itag,source,requiressl,xpc,susc,app,ic,eaua,pcm2,mime,vprv,rqh,dur,lmt&sig=AHEqNM4wRgIhALDGfeMdd8X9RgLh6EMXFCld3QnM26RQJ9BrGU3hNkmwAiEAmyrpFobt3QA_4PisL8M0Me07l__EF6op1WWU42pzA9o=&redirect_counter=1&rm=sn-cvhsk7s&rrc=104&req_id=4a8910583ebba3ee&cms_redirect=yes&cmsv=e&ipbypass=yes&met=1781268121,&mh=JF&mip=49.36.101.216&mm=32&mn=sn-cvh76nle&ms=su&mt=1781267823&mv=m&mvi=2&pl=21&lsparams=ipbypass,met,mh,mip,mm,mn,ms,mv,mvi,pl,rms,sc&lsig=APaTxxMwRQIhAPk-IgD8G-cRsVCaMZWymBCtvH_8px3aUM7EST3glsw5AiAQUtBIuXX6z1aiO-Z2hImmRkAfLEbcsaqCF33c7H-OuA%3D%3D' },
  { type: 'video', url: '/background.mp4' },
  { type: 'image', url: '/storefront.jpg' },
  { type: 'image', url: '/interior.jpg' },
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
      backgroundColor: '#131317'
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
              opacity: isCurrent ? (fade ? 0.65 : 0) : 0.65,
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
                onError={() => {
                  // If video fails to load, remove it and restart transition safely
                  setMediaList((prev) => prev.filter((m) => m.url !== item.url));
                  setCurrentIndex(0);
                  setPrevIndex(null);
                  setFade(true);
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
        background: 'radial-gradient(circle at center, rgba(19, 19, 23, 0.2) 0%, rgba(19, 19, 23, 0.78) 100%)',
        backdropFilter: 'blur(20px) saturate(140%)',
        zIndex: 3
      }} />
    </div>
  );
};
