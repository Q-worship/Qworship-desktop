import React, { useState } from 'react';
import { useBibleStore } from '../bible.store';
import { OnScreenBibleEditor } from "@/features/dashboard/components/OnScreenBibleEditor";
import { HandsfreeBibleWidget } from "@/features/dashboard/components/HandsfreeBibleWidget";

export const BibleWorkspace: React.FC = () => {
  const {
    activeContent,
    setActiveContent,
    isListeningMode,
    toggleListeningMode,
    selectedBibleVersion,
    setSelectedBibleVersion,
    detectedCommands,
    setDetectedCommands,
    verseData,
    formattedReference
  } = useBibleStore();

  const [simulatedVolume, setSimulatedVolume] = useState(0);

  // In the real app, this mimics QworshipHome's preview space
  const previewBackground = '#000000';

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#1a0f2e]">
      
      {/* Left Column: Editor */}
      <div className="w-1/2 min-w-[500px] border-r border-gray-700 flex flex-col h-full overflow-hidden">
        <OnScreenBibleEditor 
          content={activeContent}
          onUpdate={(updatedContent) => {
             setActiveContent(updatedContent);
             
             // Extract reference for widget
             if (updatedContent.reference) {
                // To keep synced with the Handsfree widget
                useBibleStore.getState().setFormattedReference(updatedContent.reference);
             }
          }}
        />
      </div>

      {/* Right Column: Preview Area */}
      <div 
        className="w-1/2 flex-1 flex flex-col items-center justify-center relative min-h-[500px]"
        style={{ backgroundColor: previewBackground }}
      >
        {activeContent && activeContent.slides && activeContent.slides.length > 0 ? (
          <div className="w-full h-full p-12 flex flex-col justify-center text-center">
             <h1 className="text-white text-5xl font-bold mb-8">
               {activeContent.slides[0].title}
             </h1>
             <p className="text-gray-200 text-3xl leading-relaxed mx-auto max-w-4xl">
               {activeContent.slides[0].content}
             </p>
          </div>
        ) : (
          <div className="text-gray-500 text-lg">
            Search or select a Bible verse to render live preview
          </div>
        )}
        
        {/* Hands-free Widget overlay */}
        <div className="absolute top-6 right-6 w-80 shadow-2xl z-50">
           <HandsfreeBibleWidget 
             isFullscreen={false}
             isListeningMode={isListeningMode}
             onToggleMicrophone={toggleListeningMode}
             selectedBibleVersion={selectedBibleVersion}
             setSelectedBibleVersion={setSelectedBibleVersion}
             detectedCommands={detectedCommands}
             setDetectedCommands={setDetectedCommands}
             verseData={verseData}
             formattedReference={formattedReference}
             volume={simulatedVolume}
           />
        </div>
        
      </div>

    </div>
  );
};
