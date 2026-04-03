import React from "react";
import { MyMediaPatch } from "@/features/dashboard/components/MyMediaPatch";

interface AssetsPageProps {
  onAssetSelect?: (assetUrl: string, assetType: string) => void;
  isModal?: boolean;
  filterType?: 'all' | 'video';
  mode?: 'browse' | 'import';
  recentlyUploadedMediaId?: number | null;
}

export const AssetsPage = ({ onAssetSelect, isModal = false, filterType = 'all', mode = 'browse', recentlyUploadedMediaId = null }: AssetsPageProps): JSX.Element => {
  return <MyMediaPatch onAssetSelect={onAssetSelect} isModal={isModal} filterType={filterType} mode={mode} recentlyUploadedMediaId={recentlyUploadedMediaId} />;
};