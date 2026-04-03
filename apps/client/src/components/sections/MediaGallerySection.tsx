import { SearchIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DynamicMediaSections } from "./DynamicMediaSections";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ImportFilesModal } from "@/features/dashboard/components/modals/ImportFilesModal";

interface MediaGallerySectionProps {
  activeTab: 'cloud-media' | 'my-media';
  onTabChange: (tab: 'cloud-media' | 'my-media') => void;
}

export const MediaGallerySection = ({ activeTab, onTabChange }: MediaGallerySectionProps): JSX.Element => {
  const { user } = useAuth();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Check if user has uploaded or used assets by fetching their media data
  const { data: userMediaStats } = useQuery({
    queryKey: ['/api/user-media-stats', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const userId = user?.id?.toString() || '';
  // For now, assume new users haven't used/uploaded assets until we have proper auth working
  const hasUsedAssets = false; // userMediaStats?.hasUsedAssets || false;
  const hasUploadedAssets = false; // userMediaStats?.hasUploadedAssets || false;

  return (
    <section className="w-full bg-[#392a48] py-1 px-4 mt-[-1px] mb-[-1px] pt-[4px] pb-[4px]">
      <div className="w-full">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between mb-2 gap-4">
          {/* Search section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              <Input
                placeholder="Search"
                className="pl-10 pr-4 py-2 bg-transparent border border-white/20 rounded-md text-white text-sm placeholder:text-white/70 focus-visible:ring-0 focus-visible:border-white/40 w-64 mt-[12px] mb-[12px]"
              />
            </div>
            <Button 
              variant="ghost" 
              className="text-white text-sm hover:bg-white/10"
              onClick={() => setIsImportModalOpen(true)}
            >
              Import files...
            </Button>
          </div>

          {/* Media tabs */}
          <div className="flex justify-center">
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'cloud-media' | 'my-media')} className="w-auto">
              <TabsList className="bg-[#1d0d46] p-1 rounded-full">
                <TabsTrigger
                  value="cloud-media"
                  className="py-2 px-6 rounded-full text-white font-medium text-sm data-[state=active]:bg-[#8356f3]"
                >
                  CLOUD MEDIA
                </TabsTrigger>
                <TabsTrigger
                  value="my-media"
                  className="py-2 px-6 rounded-full text-white font-medium text-sm data-[state=active]:bg-[#8356f3]"
                >
                  MY MEDIA
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filter section */}
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm font-medium">Filter by</span>
            <Select defaultValue="suggested">
              <SelectTrigger className="w-40 bg-[#8356f3] border border-[#8356f3] rounded-md text-white text-sm px-3 py-2 hover:bg-[#9567f4] transition-colors [&>svg]:text-white">
                <SelectValue placeholder="Suggested" />
              </SelectTrigger>
              <SelectContent className="bg-[#1d0d46] border border-[#8356f3]">
                <SelectItem value="suggested" className="text-white hover:bg-[#8356f3] focus:bg-[#8356f3]">Suggested</SelectItem>
                <SelectItem value="recent" className="text-white hover:bg-[#8356f3] focus:bg-[#8356f3]">Recent</SelectItem>
                <SelectItem value="popular" className="text-white hover:bg-[#8356f3] focus:bg-[#8356f3]">Popular</SelectItem>
                <SelectItem value="alphabetical" className="text-white hover:bg-[#8356f3] focus:bg-[#8356f3]">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


      </div>
      
      {/* Import Files Modal */}
      <ImportFilesModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
      />
    </section>
  );
};