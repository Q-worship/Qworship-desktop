import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Image, Download, Share, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface MediaFilterSectionProps {
  selectedMedia: {
    sectionIndex: number;
    itemIndex: number;
    title: string;
    color: string;
    type: string;
    asset?: any;
  } | null;
  onMediaSelect: (selectedMedia: {
    sectionIndex: number;
    itemIndex: number;
    title: string;
    color: string;
    type: string;
    asset?: any;
  } | null) => void;
  onFilterChange?: (filterCriteria: {
    categories: string[];
    mediaTypes: string[];
    tags: string[];
    seasons: string[];
    recent: string[];
  }) => void;
  activeTab: 'cloud-media' | 'my-media';
}

export const MediaFilterSection = ({ 
  selectedMedia, 
  onMediaSelect, 
  onFilterChange, 
  activeTab 
}: MediaFilterSectionProps): JSX.Element => {
  
  const [selectedFilters, setSelectedFilters] = useState<{
    categories: string[];
    mediaTypes: string[];
    tags: string[];
    seasons: string[];
    recent: string[];
  }>({
    categories: [],
    mediaTypes: [],
    tags: [],
    seasons: [],
    recent: []
  });

  // Fetch cloud media to extract available categories
  const { data: cloudMedia = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/cloud-media'],
    enabled: true
  });

  // Fetch user media assets to get user-specific tags and categories
  const { data: userMediaData } = useQuery({
    queryKey: ['/api/user-media-assets'],
    enabled: activeTab === 'my-media' // Only fetch when on MY MEDIA tab
  });

  // Extract unique categories from cloud media assets AND user media assets
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    
    // Add categories from cloud media
    if (Array.isArray(cloudMedia)) {
      cloudMedia.forEach((asset: any) => {
        if (asset.tags) {
          asset.tags.forEach((tag: string) => uniqueCategories.add(tag));
        }
        if (asset.collection) {
          uniqueCategories.add(asset.collection);
        }
      });
    }
    
    // Add categories and tags from user media (for MY MEDIA tab)
    if (activeTab === 'my-media' && userMediaData && (userMediaData as any)?.assets) {
      (userMediaData as any).assets.forEach((asset: any) => {
        if (asset.tags && Array.isArray(asset.tags)) {
          asset.tags.forEach((tag: string) => uniqueCategories.add(tag));
        }
        if (asset.categories && Array.isArray(asset.categories)) {
          asset.categories.forEach((category: string) => uniqueCategories.add(category));
        }
      });
    }
    
    return Array.from(uniqueCategories).map(name => ({ name }));
  }, [cloudMedia, userMediaData, activeTab]);

  // Define static filter categories with dynamic content
  const filterCategories = [
    {
      title: "Recent",
      titleClass: "text-[#cea2fd]",
      items: ["Recently used", "Recently added"],
      type: "recent" as const,
    },
    {
      title: "Media Type",
      titleClass: "text-[#cea2fd]",
      items: ["Motion Background", "Motion Backgrounds", "Images", "Videos", "Slides"],
      type: "mediaTypes" as const,
    },
    {
      title: "Media Tags & Collections",
      titleClass: "text-[#cea2fd]",
      items: categories.filter((cat: any) => !cat.parentId).map((cat: any) => cat.name) || ["Waves", "Science Visuals", "Trees", "Flowers"],
      type: "categories" as const,
    },
    {
      title: "Seasons",
      titleClass: "text-[#cea2fd]",
      items: [
        "Easter",
        "Christmas", 
        "Lent",
        "Advent",
        "Ordinary Time",
        "Thanksgiving",
      ],
      type: "seasons" as const,
    },
    {
      title: "Service Items",
      titleClass: "text-[#cea2fd]",
      items: [
        "Hands-free Bible",
        "Song", 
        "Announcement",
        "On-screen Bible",
        "Slide Canvas",
        "Content",
      ],
      type: "service" as const,
    },
    {
      title: "Live Screen Items",
      titleClass: "text-[#cea2fd]",
      items: ["Logo", "Images", "Videos", "Content"],
      type: "liveScreen" as const,
    },
  ];

  // Handle filter selection and communicate changes
  const handleFilterClick = (categoryType: string, item: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (categoryType === 'categories') {
        if (newFilters.categories.includes(item)) {
          newFilters.categories = newFilters.categories.filter(cat => cat !== item);
        } else {
          newFilters.categories = [...newFilters.categories, item];
        }
      } else if (categoryType === 'mediaTypes') {
        if (newFilters.mediaTypes.includes(item)) {
          newFilters.mediaTypes = newFilters.mediaTypes.filter(type => type !== item);
        } else {
          newFilters.mediaTypes = [...newFilters.mediaTypes, item];
        }
      } else if (categoryType === 'seasons') {
        if (newFilters.seasons.includes(item)) {
          newFilters.seasons = newFilters.seasons.filter(season => season !== item);
        } else {
          newFilters.seasons = [...newFilters.seasons, item];
        }
      } else if (categoryType === 'recent') {
        if (newFilters.recent.includes(item)) {
          newFilters.recent = newFilters.recent.filter(recent => recent !== item);
        } else {
          newFilters.recent = [...newFilters.recent, item];
        }
      }
      
      // Communicate filter changes to parent immediately for dynamic updates
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      
      return newFilters;
    });
  };

  // Effect to handle when all filters are completely deselected
  useEffect(() => {
    const allFiltersEmpty = (
      selectedFilters.categories.length === 0 && 
      selectedFilters.mediaTypes.length === 0 && 
      selectedFilters.tags.length === 0 && 
      selectedFilters.seasons.length === 0 &&
      selectedFilters.recent.length === 0
    );

    // If all filters are empty and we have a callback, communicate this to parent for default view
    if (allFiltersEmpty && onFilterChange) {
      onFilterChange(selectedFilters);
    }
  }, [selectedFilters, onFilterChange]);

  // Check if a filter item is selected
  const isFilterSelected = (categoryType: string, item: string): boolean => {
    switch (categoryType) {
      case 'categories':
        return selectedFilters.categories.includes(item);
      case 'mediaTypes':
        return selectedFilters.mediaTypes.includes(item);
      case 'seasons':
        return selectedFilters.seasons.includes(item);
      case 'recent':
        return selectedFilters.recent.includes(item);
      default:
        return false;
    }
  };

  // Auto-highlight filters based on selected media (bidirectional highlighting)
  useEffect(() => {
    if (selectedMedia?.asset && activeTab === 'cloud-media') {
      const asset = selectedMedia.asset;
      
      // Extract categories from the asset
      const assetCategories: string[] = [];
      
      // If asset has direct category reference
      if (asset.categoryId) {
        const category = categories.find((cat: any) => cat.id === asset.categoryId);
        if (category) {
          assetCategories.push(category.name);
        }
      }
      
      // If asset has tags that match categories
      if (asset.tags) {
        asset.tags.forEach((tag: string) => {
          const matchingCategory = categories.find((cat: any) => 
            cat.name.toLowerCase() === tag.toLowerCase()
          );
          if (matchingCategory && !assetCategories.includes(matchingCategory.name)) {
            assetCategories.push(matchingCategory.name);
          }
        });
      }
      
      // Extract media type
      const mediaTypes: string[] = [];
      if (asset.fileType) {
        switch (asset.fileType.toLowerCase()) {
          case 'image':
            mediaTypes.push('Images');
            break;
          case 'video':
            mediaTypes.push('Video', 'Motion Backgrounds');
            break;
          default:
            break;
        }
      }
      
      // Update selected filters to highlight matching ones
      const newFilters = {
        categories: assetCategories,
        mediaTypes: mediaTypes,
        tags: asset.tags || [],
        seasons: [], // Reset seasons as they're not tied to specific assets
        recent: []
      };
      
      setSelectedFilters(newFilters);
      
      // Don't communicate auto-highlights as filter changes to prevent content filtering
      // Only communicate user-initiated filter clicks
    } else if (!selectedMedia) {
      // Clear all filters when no media is selected and communicate to parent
      const clearedFilters = {
        categories: [],
        mediaTypes: [],
        tags: [],
        seasons: [],
        recent: []
      };
      
      setSelectedFilters(clearedFilters);
      
      // Communicate cleared filters to return to default view
      if (onFilterChange) {
        onFilterChange(clearedFilters);
      }
    }
  }, [selectedMedia, categories, activeTab]);

  // Clear filters when switching tabs and communicate to parent
  useEffect(() => {
    const clearedFilters = {
      categories: [],
      mediaTypes: [],
      tags: [],
      seasons: [],
      recent: []
    };
    
    setSelectedFilters(clearedFilters);
    
    // Communicate cleared filters to return to default view when switching tabs
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  }, [activeTab, onFilterChange]);

  return (
    <div className="w-64 bg-[#1a0b2e] p-4 border-r border-gray-600/30 h-full">
      <ScrollArea className="h-full pr-3">
        <div className="flex flex-col gap-4">
          {filterCategories.map((category, index) => (
            <div key={`category-${index}`} className="flex flex-col gap-2">
              <h3
                className="font-semibold text-[#cea2fd] text-sm font-['Poppins',Helvetica] mt-[7px] mb-[7px]"
              >
                {category.title}
              </h3>
              <div className="flex flex-col gap-1 pl-2">
                {category.items.map((item, itemIndex) => {
                  const isSelected = isFilterSelected(category.type, item);
                  const isClickable = ['categories', 'mediaTypes', 'seasons', 'recent'].includes(category.type);
                  
                  return (
                    <button
                      key={`item-${index}-${itemIndex}`}
                      onClick={() => isClickable && handleFilterClick(category.type, item)}
                      className={`text-left p-1 rounded text-xs font-['Poppins',Helvetica] transition-colors ${
                        isSelected 
                          ? 'bg-[#8356f3] text-white' 
                          : isClickable 
                            ? 'text-white hover:bg-[#4a3558] cursor-pointer' 
                            : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!isClickable}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {index < filterCategories.length - 1 && (
                <Separator className="bg-[#2a1b3e] mt-1" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};