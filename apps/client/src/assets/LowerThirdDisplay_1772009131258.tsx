/**
 * Lower Third Display Component
 * Renders lower third templates with dynamic content and font sizing
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  LowerThirdTemplate,
  LowerThirdElement,
  LowerThirdDisplayData,
  CONTAINER_HEIGHT_CONSTRAINTS
} from './lower-third-types';
import {
  calculateOptimalFontSize,
  estimateLineCount,
  getResponsiveFontSize,
  getAnimationDuration,
  getEasingFunction,
  RESOLUTION_CONFIGS
} from './lower-third-utils';

interface LowerThirdDisplayProps {
  template: LowerThirdTemplate;
  data: LowerThirdDisplayData;
  isVisible?: boolean;
  resolution?: { width: number; height: number };
  onAnimationComplete?: () => void;
}

/**
 * Lower Third Display Component
 * Renders the lower third with dynamic content and animations
 */
export const LowerThirdDisplay: React.FC<LowerThirdDisplayProps> = ({
  template,
  data,
  isVisible = true,
  resolution = { width: 1920, height: 1080 },
  onAnimationComplete
}) => {
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set());
  const [calculatedFontSizes, setCalculatedFontSizes] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate container height
  const containerHeightPercent = template.containerRecommendedHeight || CONTAINER_HEIGHT_CONSTRAINTS.recommendedPercentage;
  const containerHeightPx = (containerHeightPercent / 100) * resolution.height;

  // Calculate scale factor
  const scaleFactor = resolution.height / 1080;

  // Get dynamic content for elements
  const getElementContent = (element: LowerThirdElement): string => {
    if (!element.binding) {
      return element.text || '';
    }

    const fieldValue = data[element.binding.field as keyof LowerThirdDisplayData];
    return (fieldValue as string) || element.binding.placeholder || '';
  };

  // Calculate font sizes for text elements
  useEffect(() => {
    const fontSizes: Record<string, number> = {};

    template.elements.forEach(element => {
      if (element.type === 'text' && element.fontSizeDynamic && element.fontSizeMin && element.fontSizeMax) {
        const content = getElementContent(element);
        const elementWidthPx = (element.width as number) * (resolution.width / 100);

        // Calculate optimal font size based on content
        const optimalSize = calculateOptimalFontSize(
          content,
          elementWidthPx,
          element.fontSizeMin,
          element.fontSizeMax,
          element.fontFamily || 'Inter',
          element.fontWeight || 400
        );

        // Scale for resolution
        const scaledSize = Math.round(optimalSize * scaleFactor);
        fontSizes[element.id] = scaledSize;
      }
    });

    setCalculatedFontSizes(fontSizes);
  }, [template, data, resolution]);

  // Handle element animations
  useEffect(() => {
    if (!isVisible) {
      setAnimatingElements(new Set());
      return;
    }

    const animatingSet = new Set<string>();

    template.elements.forEach(element => {
      if (element.animation && element.animation.type !== 'none') {
        animatingSet.add(element.id);

        const duration = getAnimationDuration(element.animation.type);
        const totalDelay = (element.animation.delay || 0) + duration;

        const timeout = setTimeout(() => {
          animatingSet.delete(element.id);
          setAnimatingElements(new Set(animatingSet));

          if (animatingSet.size === 0) {
            onAnimationComplete?.();
          }
        }, totalDelay);

        return () => clearTimeout(timeout);
      }
    });

    setAnimatingElements(animatingSet);
  }, [isVisible, template, onAnimationComplete]);

  // Render individual element
  const renderElement = (element: LowerThirdElement): React.ReactNode => {
    if (!element.visible) {
      return null;
    }

    const isAnimating = animatingElements.has(element.id);
    const animation = element.animation;

    // Calculate position and size
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      width: typeof element.width === 'number' ? `${element.width}%` : element.width,
      height: typeof element.height === 'number' ? `${element.height}%` : element.height,
      zIndex: element.zIndex,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      transform: `rotate(${element.rotation || 0}deg)`,
      transition: isAnimating ? 'none' : 'all 0.3s ease-out'
    };

    // Apply styling
    if (element.backgroundColor) {
      style.backgroundColor = element.backgroundColor;
    }
    if (element.borderColor) {
      style.borderColor = element.borderColor;
      style.borderWidth = `${element.borderWidth || 1}px`;
      style.borderStyle = 'solid';
    }
    if (element.borderRadius) {
      style.borderRadius = `${element.borderRadius}px`;
    }
    if (element.boxShadow) {
      style.boxShadow = element.boxShadow;
    }
    if (element.clipPath) {
      style.clipPath = element.clipPath;
    }

    // Apply animation
    if (isAnimating && animation && animation.type !== 'none') {
      const animationName = getAnimationKeyframes(animation.type);
      const duration = getAnimationDuration(animation.type);
      const delay = animation.delay || 0;
      const easing = animation.easing || 'ease-out';

      style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms forwards`;

      // Font size animation
      if (element.type === 'text' && animation.animateFontSize && element.fontSizeDynamic) {
        style.animation += `, fontSizeAnimation ${duration}ms ${easing} ${delay}ms forwards`;
      }
    }

    // Render based on element type
    switch (element.type) {
      case 'text':
        return renderTextElement(element, style);
      case 'shape':
        return renderShapeElement(element, style);
      case 'image':
        return renderImageElement(element, style);
      case 'icon':
        return renderIconElement(element, style);
      case 'group':
        return renderGroupElement(element, style);
      default:
        return null;
    }
  };

  // Render text element
  const renderTextElement = (element: LowerThirdElement, baseStyle: React.CSSProperties) => {
    const content = getElementContent(element);
    const fontSize = calculatedFontSizes[element.id] || (element.fontSize || 24);

    const style: React.CSSProperties = {
      ...baseStyle,
      fontFamily: element.fontFamily || 'Inter',
      fontSize: `${fontSize}px`,
      fontWeight: element.fontWeight || 400,
      fontStyle: element.fontStyle || 'normal',
      color: element.textColor || '#ffffff',
      textAlign: element.textAlign || 'left',
      lineHeight: element.lineHeight || 1.4,
      letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
      overflow: element.textOverflow === 'truncate' ? 'hidden' : 'visible',
      textOverflow: element.textOverflow === 'truncate' ? 'ellipsis' : undefined,
      whiteSpace: element.textOverflow === 'truncate' ? 'nowrap' : 'normal',
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'
    };

    if (element.lineClamp) {
      style.WebkitLineClamp = element.lineClamp;
      style.WebkitBoxOrient = 'vertical';
      style.display = '-webkit-box';
    }

    return (
      <div key={element.id} style={style}>
        {content}
      </div>
    );
  };

  // Render shape element
  const renderShapeElement = (element: LowerThirdElement, baseStyle: React.CSSProperties) => {
    return <div key={element.id} style={baseStyle} />;
  };

  // Render image element
  const renderImageElement = (element: LowerThirdElement, baseStyle: React.CSSProperties) => {
    const style: React.CSSProperties = {
      ...baseStyle,
      objectFit: element.objectFit || 'cover'
    };

    return <img key={element.id} src={element.src} alt={element.name} style={style} />;
  };

  // Render icon element
  const renderIconElement = (element: LowerThirdElement, baseStyle: React.CSSProperties) => {
    return <div key={element.id} style={baseStyle} />;
  };

  // Render group element
  const renderGroupElement = (element: LowerThirdElement, baseStyle: React.CSSProperties) => {
    return <div key={element.id} style={baseStyle} />;
  };

  // Get animation keyframes
  const getAnimationKeyframes = (type: string): string => {
    switch (type) {
      case 'fadeIn':
        return 'fadeInAnimation';
      case 'slideIn':
        return 'slideInAnimation';
      case 'scaleIn':
        return 'scaleInAnimation';
      case 'rotateIn':
        return 'rotateInAnimation';
      default:
        return 'fadeInAnimation';
    }
  };

  // Render
  return (
    <>
      <style>{`
        @keyframes fadeInAnimation {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInAnimation {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleInAnimation {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotateInAnimation {
          from {
            opacity: 0;
            transform: rotate(-10deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotate(0) scale(1);
          }
        }

        @keyframes fontSizeAnimation {
          from {
            font-size: 0;
          }
          to {
            font-size: 1em;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: `${containerHeightPercent}%`,
          minHeight: `${CONTAINER_HEIGHT_CONSTRAINTS.minPercentage}%`,
          maxHeight: `${CONTAINER_HEIGHT_CONSTRAINTS.maxPercentage}%`,
          backgroundColor: template.backgroundColor,
          overflow: 'hidden',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      >
        {template.elements.map(element => renderElement(element))}
      </div>
    </>
  );
};

export default LowerThirdDisplay;
