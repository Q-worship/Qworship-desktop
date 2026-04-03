import React, { useState } from "react";
import { XIcon, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useImportSong } from "@/features/songs/api/useSongs";

interface SongImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (songData: any) => void;
}

export const SongImportModal: React.FC<SongImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}) => {
  const [selectedFormat, setSelectedFormat] = useState("DOCX");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getAcceptedFileTypes = () => {
    switch (selectedFormat) {
      case "TEXT":
        return ".txt,.text";
      case "DOCX":
        return ".docx,.doc";
      default:
        return "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // Add new files to existing selection instead of replacing
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleAddFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = getAcceptedFileTypes();
    input.onchange = handleFileSelect as any;
    input.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Reset selection if the selected file is removed
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
    } else if (selectedFileIndex !== null && selectedFileIndex > index) {
      // Adjust selected index if a file before it was removed
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

  const selectFileForParsing = (index: number) => {
    setSelectedFileIndex(index);
  };

  // File import mutation
  const importMutation = useImportSong();

  const handleImport = async () => {
    if (selectedFileIndex === null) return;
    
    const selectedFile = selectedFiles[selectedFileIndex];
    setIsImporting(true);
    
    importMutation.mutate(
      { file: selectedFile, format: selectedFormat },
      {
        onSuccess: (data) => {
          toast({
            title: "Import Successful",
            description: `"${data.song.title}" has been imported with ${data.parsedData.sectionsFound} sections.`,
          });
          
          if (onImportComplete) {
            onImportComplete(data.song);
          }
          
          setSelectedFiles([]);
          setSelectedFileIndex(null);
          setIsImporting(false);
          onClose();
        },
        onError: (error: Error) => {
          toast({
            title: "Import Failed", 
            description: error.message,
            variant: "destructive",
          });
          setIsImporting(false);
        }
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a1f4b] rounded-lg w-full max-w-6xl h-[700px] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">
            Song import wizard
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1537] rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-hidden">
          {/* Section Title */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Song import wizard</h3>
            <p className="text-gray-300 text-sm">
              Please select the import format and folder to import from
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white block">
              Format
            </label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-full bg-[#1a1537] border-gray-600 text-white hover:bg-[#1a1537] hover:border-gray-500">
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a1f4b] border-gray-600">
                <SelectItem value="TEXT" className="text-white hover:bg-[#1a1537] hover:text-white focus:bg-[#1a1537] focus:text-white">TEXT</SelectItem>
                <SelectItem value="DOCX" className="text-white hover:bg-[#1a1537] hover:text-white focus:bg-[#1a1537] focus:text-white">DOCX</SelectItem>
                <SelectItem value="CCLI" disabled className="text-gray-400 cursor-not-allowed opacity-60 hover:bg-transparent hover:text-gray-400">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-400">SongSelect By CCLI</span>
                      <span className="text-xs text-gray-500 ml-2 italic">(Premium feature)</span>
                    </div>
                    <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                      Coming Soon
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Area */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 bg-[#1a1537]/30 flex-1 min-h-0">
            {selectedFiles.length > 0 ? (
              <div className="h-full flex flex-col">
                <p className="text-gray-300 text-sm font-medium mb-3">
                  Selected files ({selectedFiles.length}):
                </p>
                <div className={`space-y-3 pr-2 ${selectedFiles.length > 2 ? 'h-40 overflow-y-auto' : ''}`}>
                  {selectedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                        selectedFileIndex === index 
                          ? 'bg-[#8356F3] border-2 border-purple-400' 
                          : 'bg-[#1a1537] hover:bg-[#2a2147] border-2 border-transparent'
                      }`}
                      onClick={() => selectFileForParsing(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          selectedFileIndex === index ? 'bg-white' : 'bg-purple-600'
                        }`}>
                          <span className={`text-xs font-bold ${
                            selectedFileIndex === index ? 'text-purple-600' : 'text-white'
                          }`}>
                            {file.name.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{file.name}</p>
                          <p className={`text-xs ${
                            selectedFileIndex === index ? 'text-purple-100' : 'text-gray-400'
                          }`}>
                            {(file.size / 1024).toFixed(1)} KB
                            {selectedFileIndex === index && (
                              <span className="ml-2 font-medium">• Selected for import</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className={`transition-colors ${
                          selectedFileIndex === index 
                            ? 'text-purple-100 hover:text-white' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                </div>
                <p className="text-gray-300 text-sm italic mb-2">
                  Click "Add files" to select multiple files from your device
                </p>
                <p className="text-gray-400 text-xs">
                  Supported formats: {selectedFormat} • Multiple files allowed
                </p>
              </div>
            )}
          </div>

          {/* Add Files Button */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={handleAddFiles}
              className="bg-[#8356F3] hover:bg-[#6d42c7] text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              {selectedFiles.length > 0 ? 'Add more files' : 'Add files'}
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                onClick={() => {
                  setSelectedFiles([]);
                  setSelectedFileIndex(null);
                }}
                variant="outline"
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-[#1a1537] hover:border-gray-500 px-4 py-2"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-600 flex-shrink-0">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="bg-transparent border-gray-600 text-white hover:bg-[#1a1537] hover:border-gray-500"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedFileIndex === null || isImporting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedFileIndex !== null && !isImporting
                ? 'bg-[#8356F3] hover:bg-[#6d42c7] text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isImporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Importing...</span>
              </div>
            ) : (
              'Import song'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};