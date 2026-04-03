import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { obsService } from "@/services/OBSConnectionService";
import { Loader2, AlertCircle, Music, Book, Megaphone, Heart, DollarSign, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SceneMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SceneMappings {
  [key: string]: string;
}

const SERVICE_ITEM_TYPES = [
  { value: "song", label: "Song", icon: Music },
  { value: "bible", label: "Bible", icon: Book },
  { value: "scripture", label: "Scripture", icon: Book },
  { value: "announcement", label: "Announcement", icon: Megaphone },
  { value: "prayer", label: "Prayer", icon: Heart },
  { value: "offering", label: "Offering", icon: DollarSign },
  { value: "custom", label: "Custom", icon: FileText },
];

export function SceneMappingModal({ isOpen, onClose }: SceneMappingModalProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [availableScenes, setAvailableScenes] = useState<string[]>([]);
  const [sceneMappings, setSceneMappings] = useState<SceneMappings>({});
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);

  const { data: obsSettings, isLoading: isLoadingSettings } = useQuery<{ success: boolean; settings: any | null }>({
    queryKey: ['/api/obs/settings'],
    enabled: isOpen,
  });

  useEffect(() => {
    const unsubscribe = obsService.onStatusChange((status) => {
      setIsConnected(status.connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen && isConnected) {
      loadScenes();
    }
  }, [isOpen, isConnected]);

  useEffect(() => {
    if (obsSettings?.settings?.sceneMappings) {
      try {
        const mappings = typeof obsSettings.settings.sceneMappings === 'string' 
          ? JSON.parse(obsSettings.settings.sceneMappings)
          : obsSettings.settings.sceneMappings;
        setSceneMappings(mappings || {});
      } catch (error) {
        console.error("Error parsing scene mappings:", error);
        setSceneMappings({});
      }
    }
  }, [obsSettings]);

  const loadScenes = async () => {
    setIsLoadingScenes(true);
    try {
      const scenes = await obsService.getScenes();
      setAvailableScenes(scenes);
    } catch (error) {
      console.error("Failed to load OBS scenes:", error);
      toast({
        title: "Failed to Load Scenes",
        description: "Could not retrieve scenes from OBS. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingScenes(false);
    }
  };

  const saveMappingsMutation = useMutation({
    mutationFn: async (mappings: SceneMappings) => {
      const response = await apiRequest('PATCH', '/api/obs/scene-mappings', { sceneMappings: mappings });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scene Mappings Saved",
        description: "Your OBS scene mappings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/obs/settings'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save scene mappings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMappingChange = (itemType: string, sceneName: string) => {
    setSceneMappings(prev => ({
      ...prev,
      [itemType]: sceneName === '__none__' ? '' : sceneName,
    }));
  };

  const handleSave = () => {
    saveMappingsMutation.mutate(sceneMappings);
  };

  const handleCancel = () => {
    if (obsSettings?.settings?.sceneMappings) {
      try {
        const mappings = typeof obsSettings.settings.sceneMappings === 'string' 
          ? JSON.parse(obsSettings.settings.sceneMappings)
          : obsSettings.settings.sceneMappings;
        setSceneMappings(mappings || {});
      } catch (error) {
        setSceneMappings({});
      }
    }
    onClose();
  };

  const isLoading = isLoadingSettings || isLoadingScenes;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#1a0f2e] border-gray-600 text-white" data-testid="scene-mapping-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            OBS Scene Mappings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Map service item types to OBS scenes. When you select an item during presentation, the corresponding scene will automatically switch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isConnected ? (
            <Alert className="border-yellow-700/30 bg-yellow-900/20" data-testid="alert-not-connected">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                Connect to OBS first to configure scene mappings. Go to Settings → OBS Integration to connect.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-scenes">
              <Loader2 className="h-8 w-8 animate-spin text-[#8356F3]" />
            </div>
          ) : availableScenes.length === 0 ? (
            <Alert className="border-yellow-700/30 bg-yellow-900/20" data-testid="alert-no-scenes">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                No scenes found in OBS. Please create scenes in OBS Studio first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {SERVICE_ITEM_TYPES.map((itemType) => {
                const Icon = itemType.icon;
                return (
                  <div
                    key={itemType.value}
                    className="flex items-center justify-between p-4 bg-[#2a1f3d] rounded-lg border border-gray-600"
                    data-testid={`mapping-${itemType.value}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#8356F3]/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#8356F3]" />
                      </div>
                      <div>
                        <Label className="text-white font-medium">
                          {itemType.label}
                        </Label>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Scene to activate for {itemType.label.toLowerCase()} items
                        </p>
                      </div>
                    </div>
                    <div className="w-64">
                      <Select
                        value={sceneMappings[itemType.value] || "__none__"}
                        onValueChange={(value) => handleMappingChange(itemType.value, value)}
                        data-testid={`select-scene-${itemType.value}`}
                      >
                        <SelectTrigger className="bg-[#0f0624] border-gray-600 text-white">
                          <SelectValue placeholder="Select a scene" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a1f3d] border-gray-600">
                          <SelectItem value="__none__" className="text-gray-400">
                            No scene mapping
                          </SelectItem>
                          {availableScenes.map((scene) => (
                            <SelectItem
                              key={scene}
                              value={scene}
                              className="text-white hover:bg-[#8356F3]/20"
                            >
                              {scene}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-white hover:bg-[#2a1f3d]"
            disabled={saveMappingsMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isConnected || saveMappingsMutation.isPending || availableScenes.length === 0}
            className="bg-[#8356F3] hover:bg-[#7C4DFF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-save"
          >
            {saveMappingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Mappings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
