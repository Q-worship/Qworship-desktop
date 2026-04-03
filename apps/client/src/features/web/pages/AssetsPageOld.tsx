import React, { useState } from "react";
import { Search, Filter, Grid, List, Upload, Download, Heart, Share2, Play, Pause, Volume2 } from "lucide-react";
import qworshipLogo from "@assets/Group 1_1754122708985.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const AssetsPage = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<"cloud" | "my">("cloud");
  const [selectedCategory, setSelectedCategory] = useState("Recently used media");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Cloud Media Categories
  const cloudCategories = [
    "Recently used media",
    "Recommended",
    "Recently added",
    "Security video",
    "Security added",
    "Images",
    "Video",
    "Media Type",
    "HD background",
    "Motion backgrounds",
    "Worship",
    "Video",
    "Media Tags & Collections",
    "Worship",
    "Scripture Visuals",
    "Palm",
    "Streams"
  ];

  // My Media Categories  
  const myMediaCategories = [
    "All Media",
    "Images", 
    "Videos",
    "Audio",
    "Presentations",
    "Backgrounds",
    "Worship",
    "Scripture",
    "Announcements",
    "Special Events",
    "Christmas",
    "Easter",
    "Seasonal",
    "Youth",
    "Children",
    "Baptism",
    "Communion"
  ];

  // Sample cloud assets data
  const cloudAssets = [
    {
      id: 1,
      title: "Worship Hands Raised",
      type: "image",
      category: "Worship",
      tags: ["worship", "hands", "praise"],
      dimensions: "1920x1080",
      size: "2.4 MB",
      format: "JPG",
      description: "Beautiful worship scene with hands raised in praise",
      downloadCount: 1420,
      likes: 89,
      thumbnail: "/api/placeholder/300/200",
      preview: "/api/placeholder/600/400"
    },
    {
      id: 2,
      title: "Cross at Sunset",
      type: "image", 
      category: "Scripture Visuals",
      tags: ["cross", "sunset", "spiritual"],
      dimensions: "1920x1080",
      size: "1.8 MB",
      format: "JPG",
      description: "Peaceful cross silhouette against sunset sky",
      downloadCount: 2150,
      likes: 156,
      thumbnail: "/api/placeholder/300/200",
      preview: "/api/placeholder/600/400"
    },
    {
      id: 3,
      title: "Worship Team Performance",
      type: "video",
      category: "Worship",
      tags: ["worship", "team", "performance"],
      dimensions: "1920x1080",
      size: "45.2 MB",
      format: "MP4",
      duration: "2:34",
      description: "Dynamic worship team performance footage",
      downloadCount: 890,
      likes: 67,
      thumbnail: "/api/placeholder/300/200",
      preview: "/api/placeholder/600/400"
    },
    {
      id: 4,
      title: "Baptism Waters",
      type: "video",
      category: "Baptism",
      tags: ["baptism", "water", "spiritual"],
      dimensions: "1920x1080", 
      size: "32.1 MB",
      format: "MP4",
      duration: "1:45",
      description: "Serene baptism water background loop",
      downloadCount: 654,
      likes: 43,
      thumbnail: "/api/placeholder/300/200",
      preview: "/api/placeholder/600/400"
    }
  ];

  const categories = activeTab === "cloud" ? cloudCategories : myMediaCategories;
  const assets = activeTab === "cloud" ? cloudAssets : [];

  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <img src={qworshipLogo} alt="Q-worship" className="w-8 h-8 object-contain" />
            <h1 className="text-white text-2xl font-bold">Qworship - Assets</h1>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="text-white"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="text-white"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Categories */}
        <div className="w-64 bg-black/30 backdrop-blur-sm border-r border-purple-500/30 p-4 min-h-screen">
          <h3 className="text-white text-lg font-semibold mb-4">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-purple-600/40 text-white border border-purple-500/50"
                    : "text-gray-300 hover:bg-purple-600/20 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Storage Info for My Media */}
          {activeTab === "my" && (
            <div className="mt-8 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
              <h4 className="text-white text-sm font-medium mb-2">Storage Usage</h4>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: "45%" }}></div>
              </div>
              <p className="text-gray-300 text-xs">4.5 GB of 10 GB used</p>
              <Button size="sm" className="w-full mt-3 bg-purple-600 hover:bg-purple-700">
                Upgrade Plan
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Top Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Cloud/My Media Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-purple-500/30">
                <button
                  onClick={() => setActiveTab("cloud")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "cloud"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Cloud Media
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "my"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  My Media
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-black/40 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Button variant="outline" size="sm" className="text-white border-purple-500/30">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              {activeTab === "my" && (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            {/* Assets Grid */}
            <div className="flex-1">
              <div className="mb-4">
                <h2 className="text-white text-xl font-semibold mb-2">{selectedCategory}</h2>
                <p className="text-gray-400 text-sm">
                  {activeTab === "cloud" 
                    ? `${filteredAssets.length} free assets available`
                    : filteredAssets.length > 0 
                      ? `${filteredAssets.length} personal assets`
                      : "You have no recent media"
                  }
                </p>
              </div>

              {filteredAssets.length > 0 ? (
                <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-3" : "grid-cols-1"}`}>
                  {filteredAssets.map((asset) => (
                    <Card
                      key={asset.id}
                      className={`bg-black/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer ${
                        selectedAsset?.id === asset.id ? "border-purple-400 bg-purple-900/20" : ""
                      }`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-t-lg flex items-center justify-center border border-purple-500/20">
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto mb-2 bg-purple-600/30 rounded-lg flex items-center justify-center">
                                {asset.type === "image" ? (
                                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-purple-300 text-sm font-medium">{asset.title}</div>
                            </div>
                          </div>
                          {asset.type === "video" && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {asset.duration}
                            </div>
                          )}
                          <Badge 
                            className="absolute top-2 left-2 bg-purple-600/80 text-white"
                          >
                            {asset.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="p-3">
                          <h3 className="text-white font-medium text-sm mb-1 truncate">{asset.title}</h3>
                          <p className="text-gray-400 text-xs">{asset.dimensions} • {asset.size}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <span>{asset.downloadCount} downloads</span>
                              <span>•</span>
                              <span>{asset.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">
                    {activeTab === "cloud" ? "No assets found" : "You have no recent media"}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {activeTab === "cloud" 
                      ? "Try adjusting your search terms"
                      : "Upload your first media file to get started"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Asset Details */}
            {selectedAsset && (
              <div className="w-80 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 h-fit">
                <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-lg mb-4 flex items-center justify-center border border-purple-500/20">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-purple-600/30 rounded-lg flex items-center justify-center">
                      {selectedAsset.type === "image" ? (
                        <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-purple-300 text-lg font-medium">Preview</div>
                    <div className="text-gray-400 text-sm">{selectedAsset.format} • {selectedAsset.dimensions}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{selectedAsset.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{selectedAsset.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white">{selectedAsset.type.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Format:</span>
                      <p className="text-white">{selectedAsset.format}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <p className="text-white">{selectedAsset.size}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Dimensions:</span>
                      <p className="text-white">{selectedAsset.dimensions}</p>
                    </div>
                    {selectedAsset.duration && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Duration:</span>
                        <p className="text-white">{selectedAsset.duration}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-400 text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAsset.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{selectedAsset.downloadCount} downloads</span>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{selectedAsset.likes}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-purple-500/30">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 text-white border-purple-500/30">
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </Button>
                      <Button variant="outline" className="flex-1 text-white border-purple-500/30">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};