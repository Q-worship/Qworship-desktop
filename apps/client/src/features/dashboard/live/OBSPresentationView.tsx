import { useState, useEffect } from 'react';

interface SlideContent {
  type: 'song' | 'bible' | 'announcement' | 'custom';
  title?: string;
  sectionTitle?: string;
  content: string;
  reference?: string;
  version?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
}

export default function OBSPresentationView() {
  const [currentSlide, setCurrentSlide] = useState<SlideContent | null>(null);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Lufgord, sans-serif');
  const [fontSize, setFontSize] = useState('4rem');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);

  useEffect(() => {
    const handleSlideChange = (event: CustomEvent) => {
      const slideData = event.detail as SlideContent;
      console.log('OBS Presentation - Received slide change:', slideData);
      setCurrentSlide(slideData);

      if (slideData.textColor) setTextColor(slideData.textColor);
      if (slideData.fontFamily) setFontFamily(slideData.fontFamily);
      if (slideData.fontSize) setFontSize(slideData.fontSize);
      if (slideData.textAlign) setTextAlign(slideData.textAlign);
      if (slideData.backgroundColor) setBackgroundColor(slideData.backgroundColor);
      if (slideData.backgroundImage) setBackgroundImage(slideData.backgroundImage);
      if (slideData.backgroundVideo) setBackgroundVideo(slideData.backgroundVideo);
    };

    const handleClearSlide = () => {
      console.log('OBS Presentation - Clearing slide');
      setCurrentSlide(null);
    };

    const handleStyleUpdate = (event: CustomEvent) => {
      const styleData = event.detail;
      console.log('OBS Presentation - Received style update:', styleData);
      
      if (styleData.textColor) setTextColor(styleData.textColor);
      if (styleData.fontFamily) setFontFamily(styleData.fontFamily);
      if (styleData.fontSize) setFontSize(styleData.fontSize);
      if (styleData.textAlign) setTextAlign(styleData.textAlign);
      if (styleData.backgroundColor) setBackgroundColor(styleData.backgroundColor);
      if (styleData.backgroundImage) setBackgroundImage(styleData.backgroundImage);
      if (styleData.backgroundVideo) setBackgroundVideo(styleData.backgroundVideo);
    };

    window.addEventListener('qworship-slide-change', handleSlideChange as EventListener);
    window.addEventListener('qworship-clear-slide', handleClearSlide as EventListener);
    window.addEventListener('qworship-style-update', handleStyleUpdate as EventListener);

    console.log('OBS Presentation View - Initialized and listening for events');

    return () => {
      window.removeEventListener('qworship-slide-change', handleSlideChange as EventListener);
      window.removeEventListener('qworship-clear-slide', handleClearSlide as EventListener);
      window.removeEventListener('qworship-style-update', handleStyleUpdate as EventListener);
    };
  }, []);

  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {
      background: backgroundColor,
    };

    if (backgroundVideo) {
      return style;
    }

    if (backgroundImage) {
      style.backgroundImage = `url(${backgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    }

    return style;
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={getBackgroundStyle()}
      data-testid="obs-presentation-container"
    >
      {backgroundVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          data-testid="background-video"
        />
      )}

      <div className="relative z-10 w-full h-full flex items-center justify-center p-16">
        {currentSlide ? (
          <div
            className="w-full max-w-7xl"
            style={{
              textAlign: textAlign,
            }}
            data-testid="slide-content"
          >
            {currentSlide.type === 'song' && (
              <>
                {currentSlide.title && (
                  <h1
                    className="font-bold mb-4"
                    style={{
                      color: textColor,
                      fontFamily: fontFamily,
                      fontSize: `calc(${fontSize} * 0.7)`,
                      textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                      marginBottom: '1.5rem',
                    }}
                    data-testid="slide-title"
                  >
                    {currentSlide.title}
                  </h1>
                )}
                {currentSlide.sectionTitle && (
                  <h2
                    className="font-semibold mb-6"
                    style={{
                      color: '#8DD3F5',
                      fontFamily: fontFamily,
                      fontSize: `calc(${fontSize} * 0.5)`,
                      textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                      marginBottom: '2rem',
                    }}
                    data-testid="slide-section-title"
                  >
                    {currentSlide.sectionTitle}
                  </h2>
                )}
                <div
                  className="whitespace-pre-line leading-relaxed"
                  style={{
                    color: textColor,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                    lineHeight: '1.6',
                  }}
                  data-testid="slide-lyrics"
                >
                  {currentSlide.content}
                </div>
              </>
            )}

            {currentSlide.type === 'bible' && (
              <>
                <div
                  className="whitespace-pre-line leading-relaxed mb-8"
                  style={{
                    color: textColor,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                    lineHeight: '1.6',
                  }}
                  data-testid="slide-bible-content"
                >
                  {currentSlide.content}
                </div>
                <div
                  className="flex flex-col items-center gap-2 mt-8"
                  style={{
                    textAlign: 'center',
                  }}
                >
                  {currentSlide.reference && (
                    <p
                      className="font-semibold"
                      style={{
                        color: '#8DD3F5',
                        fontFamily: fontFamily,
                        fontSize: `calc(${fontSize} * 0.6)`,
                        textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                      }}
                      data-testid="slide-bible-reference"
                    >
                      {currentSlide.reference}
                    </p>
                  )}
                  {currentSlide.version && (
                    <p
                      className="font-medium"
                      style={{
                        color: textColor,
                        fontFamily: fontFamily,
                        fontSize: `calc(${fontSize} * 0.4)`,
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                        opacity: 0.8,
                      }}
                      data-testid="slide-bible-version"
                    >
                      {currentSlide.version}
                    </p>
                  )}
                </div>
              </>
            )}

            {(currentSlide.type === 'announcement' || currentSlide.type === 'custom') && (
              <>
                {currentSlide.title && (
                  <h1
                    className="font-bold mb-4"
                    style={{
                      color: textColor,
                      fontFamily: fontFamily,
                      fontSize: `calc(${fontSize} * 0.8)`,
                      textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                      marginBottom: '1rem',
                    }}
                    data-testid="slide-announcement-title"
                  >
                    {currentSlide.title}
                  </h1>
                )}
                {((currentSlide as any).eventDate || (currentSlide as any).eventTime || (currentSlide as any).location) && (
                  <div
                    className="flex items-center justify-center gap-6 mb-6 flex-wrap"
                    style={{ marginBottom: '1.5rem' }}
                  >
                    {((currentSlide as any).eventDate || (currentSlide as any).eventTime) && (
                      <span
                        style={{
                          color: '#fdba74',
                          fontFamily: fontFamily,
                          fontSize: `calc(${fontSize} * 0.45)`,
                          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        📅 {(currentSlide as any).eventDate || ""}{(currentSlide as any).eventDate && (currentSlide as any).eventTime ? " · " : ""}{(currentSlide as any).eventTime || ""}
                      </span>
                    )}
                    {(currentSlide as any).location && (
                      <span
                        style={{
                          color: '#c4b5fd',
                          fontFamily: fontFamily,
                          fontSize: `calc(${fontSize} * 0.45)`,
                          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        📍 {(currentSlide as any).location}
                      </span>
                    )}
                    {(currentSlide as any).contact && (
                      <span
                        style={{
                          color: '#93c5fd',
                          fontFamily: fontFamily,
                          fontSize: `calc(${fontSize} * 0.45)`,
                          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        📞 {(currentSlide as any).contact}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className="whitespace-pre-line leading-relaxed"
                  style={{
                    color: textColor,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                    lineHeight: '1.6',
                  }}
                  data-testid="slide-announcement-content"
                >
                  {currentSlide.content}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="text-center opacity-50"
            data-testid="waiting-message"
          >
            <p
              style={{
                color: textColor,
                fontFamily: fontFamily,
                fontSize: `calc(${fontSize} * 0.8)`,
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
              }}
            >
              Waiting for content...
            </p>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-8 right-8 text-sm opacity-30"
        style={{
          color: textColor,
          fontFamily: fontFamily,
          textShadow: '1px 1px 4px rgba(0, 0, 0, 0.9)',
        }}
        data-testid="qworship-branding"
      >
        Q-worship
      </div>
    </div>
  );
}
