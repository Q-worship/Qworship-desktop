import React, { useState } from 'react';
import { PlusIcon, Music, BookOpen, MessageCircle, Heart, Settings, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SongBrowser } from './SongBrowser';
import { BibleSearchEditor } from './BibleSearchEditor';
import { apiRequest } from "@/lib/queryClient";

interface ServiceSection {
  id: number;
  name: string;
  description: string;
  order: number;
  items: ServiceItem[];
}

interface ServiceItem {
  id: number;
  sectionId: number;
  type: string;
  title: string;
  songId?: number;
  bibleReference?: string;
  bibleVersion?: string;
  bibleVerses?: string;
  slides?: string;
  order: number;
}

interface ServiceSectionManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ServiceSectionManager: React.FC<ServiceSectionManagerProps> = ({
  isVisible,
  onClose,
}) => {
  const [selectedSection, setSelectedSection] = useState<number | string | null>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showSongBrowser, setShowSongBrowser] = useState(false);
  const [showBibleEditor, setShowBibleEditor] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const queryClient = useQueryClient();

  interface SectionsResponse {
    sections: ServiceSection[];
  }

  // Fetch service sections
  const { data: sectionsData, isLoading } = useQuery<SectionsResponse>({
    queryKey: ['/api/service-sections'],
    enabled: isVisible,
  });

  // Initialize default sections if none exist
  const initializeSections = useMutation({
    mutationFn: () => apiRequest('POST', '/api/service-sections/initialize'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-sections'] });
    },
  });

  // Add song to service section
  const addServiceItem = useMutation({
    mutationFn: (itemData: any) => apiRequest('POST', '/api/service-items', itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-sections'] });
      setShowSongBrowser(false);
      setShowBibleEditor(false);
      setShowInsertMenu(false);
    },
  });

  const sections: ServiceSection[] = Array.isArray(sectionsData?.sections) ? sectionsData.sections : [];

  // Handle song selection from browser
  const handleSongSelected = (song: any) => {
    if (selectedSection) {
      // Calculate next order number
      const currentSection = sections.find(s => s.id === selectedSection);
      const nextOrder = (currentSection?.items.length || 0) + 1;

      addServiceItem.mutate({
        sectionId: selectedSection,
        type: 'song',
        title: song.title,
        songId: song.id,
        order: nextOrder,
      });
    }
  };

  const handleAddBibleItem = () => {
    if (selectedSection) {
      // Calculate next order number
      const currentSection = sections.find(s => s.id === selectedSection);
      const nextOrder = (currentSection?.items.length || 0) + 1;

      // Create a generic Bible item
      addServiceItem.mutate({
        sectionId: selectedSection,
        type: 'bible',
        title: 'Bible - on screen', // Generic title, will be replaced when scripture is selected
        order: nextOrder,
        bibleReference: null, // Explicitly set to null to avoid placeholder content
        bibleVersion: null,
        bibleVerses: null,
      });

      // Show Bible search editor
      setShowBibleEditor(true);
    }
    setShowInsertMenu(false);
  };

  const toggleSectionExpanded = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song': return <Music className="w-4 h-4" />;
      case 'scripture': return <BookOpen className="w-4 h-4" />;
      case 'bible': return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'announcement': return <MessageCircle className="w-4 h-4" />;
      case 'prayer': return <Heart className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a0f2e] border border-gray-600 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Service Planning</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Side - Service Sections */}
          <div className="w-1/2 border-r border-gray-600 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Step 1: Service Sections</h3>
              {sections.length === 0 && (
                <Button
                  size="sm"
                  onClick={() => initializeSections.mutate()}
                  disabled={initializeSections.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Initialize Sections
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-gray-400">Loading sections...</div>
            ) : sections.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No service sections found.</p>
                <p className="text-sm mt-2">Click "Initialize Sections" to create default sections.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <Card
                    key={section.id}
                    className={`bg-gray-800/50 border-gray-600 cursor-pointer transition-colors ${
                      selectedSection === section.id ? 'border-purple-500 bg-purple-900/20' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1"
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <h4 className="font-medium text-white">{section.name}</h4>
                          <p className="text-sm text-gray-400">{section.description}</p>
                          {section.items.length > 0 && (
                            <p className="text-xs text-purple-300 mt-1">
                              {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {selectedSection === section.id && (
                            <DropdownMenu open={showInsertMenu} onOpenChange={setShowInsertMenu}>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                  <PlusIcon className="w-4 h-4 mr-1" />
                                  Insert Item
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#1a0f2e] border-gray-600">
                                <DropdownMenuItem
                                  onClick={() => setShowSongBrowser(true)}
                                  className="text-white hover:bg-gray-700"
                                >
                                  <Music className="w-4 h-4 mr-2" />
                                  Song
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAddBibleItem()}
                                  className="text-white hover:bg-gray-700"
                                >
                                  <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                                  On screen Bible
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-gray-700">
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Scripture
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-gray-700">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Announcement
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-gray-700">
                                  <Heart className="w-4 h-4 mr-2" />
                                  Prayer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSectionExpanded(section.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {expandedSections[section.id] ? 
                              <ChevronDownIcon className="w-4 h-4" /> : 
                              <ChevronRightIcon className="w-4 h-4" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      {/* Section Items */}
                      {expandedSections[section.id] && section.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <div className="space-y-2">
                            {section.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-2 p-2 bg-gray-700/30 rounded"
                              >
                                {getItemIcon(item.type)}
                                <span className="text-sm text-white flex-1">{item.title}</span>
                                <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Song Browser */}
          <div className="w-1/2 overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Step 3: Browse My Songs
            </h3>
            
            {selectedSection ? (
              <div className="space-y-4">
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-300">
                    Selected section: <span className="text-purple-300 font-medium">
                      {sections.find(s => s.id === selectedSection)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Insert Item" → "Song" to browse and add songs
                  </p>
                </div>
                
                {showSongBrowser && (
                  <SongBrowser
                    onSongSelected={handleSongSelected}
                    onClose={() => setShowSongBrowser(false)}
                    isVisible={showSongBrowser}
                  />
                )}
                
                {showBibleEditor && (
                  <BibleSearchEditor
                    isVisible={showBibleEditor}
                    onClose={() => setShowBibleEditor(false)}
                    selectedSectionId={selectedSection}
                    selectedBibleItemId={sections.find(s => s.id === selectedSection)?.items?.find(item => item.type === 'bible')?.id}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a service section first</p>
                <p className="text-sm mt-1">Choose a section from the left to start adding songs</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-600 p-4">
          <div className="text-sm text-gray-400">
            <p><strong>Workflow:</strong> 1) Select Section → 2) Insert Item → Song → 3) Browse Songs → 4) Add Song</p>
            <p className="mt-1">Songs will be automatically broken into individual slides (V1, C1, V2, C2, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
};