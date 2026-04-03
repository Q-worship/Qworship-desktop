/**
 * Lower Third Builder Component
 * Complete visual editor with canvas, properties panel, and template selector
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  LowerThirdTemplate,
  LowerThirdElement,
  EditorState,
  CONTAINER_HEIGHT_CONSTRAINTS,
  FONT_SIZE_PRESETS,
  RESOLUTION_CONFIGS
} from './lower-third-types';
import {
  generateTemplateId,
  generateElementId,
  cloneElement,
  validateTemplate,
  validateElement,
  calculateOptimalFontSize,
  estimateLineCount,
  getContainerHeightConstraints,
  downloadTemplateFile
} from './lower-third-utils';
import LowerThirdDisplay from './LowerThirdDisplay';

interface LowerThirdBuilderProps {
  template: LowerThirdTemplate;
  onTemplateSave: (template: LowerThirdTemplate) => void;
  onTemplateChange: (template: LowerThirdTemplate) => void;
}

/**
 * Lower Third Builder Component
 */
export const LowerThirdBuilder: React.FC<LowerThirdBuilderProps> = ({
  template: initialTemplate,
  onTemplateSave,
  onTemplateChange
}) => {
  const [template, setTemplate] = useState<LowerThirdTemplate>(initialTemplate);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    template.elements.length > 0 ? template.elements[0].id : null
  );
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTION_CONFIGS[0]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get selected element
  const selectedElement = useMemo(
    () => template.elements.find(el => el.id === selectedElementId),
    [template.elements, selectedElementId]
  );

  // Handle template changes
  const updateTemplate = useCallback((updatedTemplate: LowerThirdTemplate) => {
    setTemplate(updatedTemplate);
    onTemplateChange(updatedTemplate);
  }, [onTemplateChange]);

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  // Handle element update
  const handleElementUpdate = (elementId: string, updates: Partial<LowerThirdElement>) => {
    const updatedElements = template.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    updateTemplate({ ...template, elements: updatedElements, updatedAt: new Date() });
  };

  // Handle element delete
  const handleElementDelete = (elementId: string) => {
    const updatedElements = template.elements.filter(el => el.id !== elementId);
    setTemplate({ ...template, elements: updatedElements });
    setSelectedElementId(updatedElements.length > 0 ? updatedElements[0].id : null);
  };

  // Handle element duplicate
  const handleElementDuplicate = (elementId: string) => {
    const element = template.elements.find(el => el.id === elementId);
    if (element) {
      const cloned = cloneElement(element);
      const updatedElements = [...template.elements, cloned];
      updateTemplate({ ...template, elements: updatedElements });
      setSelectedElementId(cloned.id);
    }
  };

  // Add new text element
  const handleAddTextElement = () => {
    const newElement: LowerThirdElement = {
      id: generateElementId('text'),
      type: 'text',
      name: `Text Element ${template.elements.length + 1}`,
      x: 5,
      y: 75,
      width: 90,
      height: 'auto',
      rotation: 0,
      text: 'Sample Text',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 400,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 400,
        delay: 0,
        easing: 'ease-out',
        animateFontSize: true
      }
    };

    const updatedElements = [...template.elements, newElement];
    updateTemplate({ ...template, elements: updatedElements });
    setSelectedElementId(newElement.id);
  };

  // Add new shape element
  const handleAddShapeElement = () => {
    const newElement: LowerThirdElement = {
      id: generateElementId('shape'),
      type: 'shape',
      name: `Shape Element ${template.elements.length + 1}`,
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      rotation: 0,
      backgroundColor: '#8b5cf6',
      zIndex: 1,
      locked: false,
      visible: true
    };

    const updatedElements = [...template.elements, newElement];
    updateTemplate({ ...template, elements: updatedElements });
    setSelectedElementId(newElement.id);
  };

  // Render canvas
  const renderCanvas = () => {
    const containerHeight = (template.containerRecommendedHeight / 100) * template.height;

    return (
      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          width: `${(template.width / 100) * zoom}%`,
          height: `${(template.height / 100) * zoom}%`,
          backgroundColor: template.backgroundColor,
          border: '2px solid #e5e7eb',
          margin: '0 auto',
          overflow: 'auto',
          backgroundImage: showGrid
            ? `linear-gradient(90deg, #f3f4f6 1px, transparent 1px), linear-gradient(#f3f4f6 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto'
        }}
      >
        {/* Container height guides */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${template.containerRecommendedHeight}%`,
            border: '2px dashed #3b82f6',
            pointerEvents: 'none',
            opacity: 0.3
          }}
        />

        {/* Min height guide */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${CONTAINER_HEIGHT_CONSTRAINTS.minPercentage}%`,
            borderBottom: '2px solid #10b981',
            pointerEvents: 'none',
            opacity: 0.2
          }}
        />

        {/* Max height guide */}
        <div
          style={{
            position: 'absolute',
            bottom: `${CONTAINER_HEIGHT_CONSTRAINTS.maxPercentage}%`,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#ef4444',
            pointerEvents: 'none',
            opacity: 0.2
          }}
        />

        {/* Elements */}
        {template.elements.map(element => (
          <div
            key={element.id}
            onClick={() => handleElementSelect(element.id)}
            style={{
              position: 'absolute',
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: typeof element.width === 'number' ? `${element.width}%` : element.width,
              height: typeof element.height === 'number' ? `${element.height}%` : element.height,
              backgroundColor: element.backgroundColor || 'transparent',
              border: selectedElementId === element.id ? '2px solid #8b5cf6' : '1px solid #d1d5db',
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: element.fontSize ? `${element.fontSize * (zoom / 100)}px` : '14px',
              color: element.textColor || '#000000',
              fontFamily: element.fontFamily || 'Inter',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              zIndex: element.zIndex
            }}
          >
            {element.type === 'text' && element.text}
            {element.type === 'shape' && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Shape</span>}
            {element.type === 'image' && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Image</span>}
          </div>
        ))}
      </div>
    );
  };

  // Render properties panel
  const renderPropertiesPanel = () => {
    if (!selectedElement) {
      return (
        <div style={{ padding: '20px', color: '#6b7280' }}>
          <p>Select an element to edit properties</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
        {/* Element Info */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Element Info</h3>
          <input
            type="text"
            value={selectedElement.name}
            onChange={e => handleElementUpdate(selectedElement.id, { name: e.target.value })}
            placeholder="Element name"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              marginBottom: '10px',
              fontSize: '14px'
            }}
          />
          <select
            value={selectedElement.type}
            onChange={e => handleElementUpdate(selectedElement.id, { type: e.target.value as any })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="text">Text</option>
            <option value="shape">Shape</option>
            <option value="image">Image</option>
            <option value="icon">Icon</option>
          </select>
        </div>

        {/* Position & Size */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Position & Size</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>X (%)</label>
              <input
                type="number"
                value={selectedElement.x}
                onChange={e => handleElementUpdate(selectedElement.id, { x: parseFloat(e.target.value) })}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Y (%)</label>
              <input
                type="number"
                value={selectedElement.y}
                onChange={e => handleElementUpdate(selectedElement.id, { y: parseFloat(e.target.value) })}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Width (%)</label>
              <input
                type="number"
                value={typeof selectedElement.width === 'number' ? selectedElement.width : 100}
                onChange={e => handleElementUpdate(selectedElement.id, { width: parseFloat(e.target.value) })}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Height (%)</label>
              <input
                type="number"
                value={typeof selectedElement.height === 'number' ? selectedElement.height : 10}
                onChange={e => handleElementUpdate(selectedElement.id, { height: parseFloat(e.target.value) })}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Font Size Constraints (for text elements) */}
        {selectedElement.type === 'text' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Font Size Constraints</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Min Font Size (px)</label>
              <input
                type="number"
                value={selectedElement.fontSizeMin || 28}
                onChange={e => handleElementUpdate(selectedElement.id, { fontSizeMin: parseInt(e.target.value) })}
                min="14"
                max="120"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Max Font Size (px)</label>
              <input
                type="number"
                value={selectedElement.fontSizeMax || 56}
                onChange={e => handleElementUpdate(selectedElement.id, { fontSizeMax: parseInt(e.target.value) })}
                min="14"
                max="120"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedElement.fontSizeDynamic || false}
                  onChange={e =>
                    handleElementUpdate(selectedElement.id, { fontSizeDynamic: e.target.checked })
                  }
                  style={{ marginRight: '6px' }}
                />
                Enable Dynamic Scaling
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedElement.fontSizeAnimated || false}
                  onChange={e =>
                    handleElementUpdate(selectedElement.id, { fontSizeAnimated: e.target.checked })
                  }
                  style={{ marginRight: '6px' }}
                />
                Animate Font Size on Entry
              </label>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Line Clamp</label>
              <input
                type="number"
                value={selectedElement.lineClamp || 5}
                onChange={e => handleElementUpdate(selectedElement.id, { lineClamp: parseInt(e.target.value) })}
                min="1"
                max="10"
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        )}

        {/* Appearance */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Appearance</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Background Color</label>
            <input
              type="color"
              value={selectedElement.backgroundColor || '#000000'}
              onChange={e => handleElementUpdate(selectedElement.id, { backgroundColor: e.target.value })}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
          </div>
          {selectedElement.type === 'text' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Text Color</label>
              <input
                type="color"
                value={selectedElement.textColor || '#ffffff'}
                onChange={e => handleElementUpdate(selectedElement.id, { textColor: e.target.value })}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Opacity</label>
            <input
              type="range"
              value={selectedElement.opacity !== undefined ? selectedElement.opacity * 100 : 100}
              onChange={e => handleElementUpdate(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
              min="0"
              max="100"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Z-Index & Visibility */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Layering</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Z-Index</label>
            <input
              type="number"
              value={selectedElement.zIndex}
              onChange={e => handleElementUpdate(selectedElement.id, { zIndex: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedElement.visible}
              onChange={e => handleElementUpdate(selectedElement.id, { visible: e.target.checked })}
              style={{ marginRight: '6px' }}
            />
            Visible
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={() => handleElementDuplicate(selectedElement.id)}
            style={{
              padding: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Duplicate
          </button>
          <button
            onClick={() => handleElementDelete(selectedElement.id)}
            style={{
              padding: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  // Render
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', height: '100vh', padding: '20px' }}>
      {/* Left Panel - Template Info & Actions */}
      <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>{template.name}</h2>

        {/* Toolbar */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleAddTextElement}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Add Text
          </button>
          <button
            onClick={handleAddShapeElement}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Add Shape
          </button>
        </div>

        {/* View Options */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', color: '#6b7280' }}>
            View Options
          </h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{ marginRight: '6px' }} />
              Show Grid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
              <input type="checkbox" checked={showRulers} onChange={e => setShowRulers(e.target.checked)} style={{ marginRight: '6px' }} />
              Show Rulers
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} style={{ marginRight: '6px' }} />
              Snap to Grid
            </label>
          </div>
        </div>

        {/* Zoom */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', color: '#6b7280' }}>
            Zoom
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => setZoom(Math.max(25, zoom - 10))} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
              −
            </button>
            <div style={{ flex: 2, padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
              {zoom}%
            </div>
            <button onClick={() => setZoom(Math.min(100, zoom + 10))} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
              +
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => onTemplateSave(template)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Save Template
        </button>
      </div>

      {/* Center Panel - Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: '8px 16px',
              backgroundColor: previewMode ? '#8b5cf6' : '#e5e7eb',
              color: previewMode ? 'white' : '#000000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {previewMode ? 'Editing Mode' : 'Preview Mode'}
          </button>
        </div>

        {previewMode ? (
          <div style={{ width: '100%', height: '600px', backgroundColor: '#000000', position: 'relative' }}>
            <LowerThirdDisplay
              template={template}
              data={{
                verse: 'For God so loved the world that he gave his one and only Son',
                reference: 'John 3:16',
                version: 'NIV'
              }}
              isVisible={true}
              resolution={selectedResolution}
            />
          </div>
        ) : (
          renderCanvas()
        )}
      </div>

      {/* Right Panel - Properties */}
      <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>Properties</h3>
        {renderPropertiesPanel()}
      </div>
    </div>
  );
};

export default LowerThirdBuilder;
