import React from "react";
import { Upload, FileText } from "lucide-react";

interface ImportPresentationModalProps {
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  handleFileImport: (file: File) => void;
  importPresentationMutation: { isPending: boolean }; // Adjust type based on react-query
}

export const ImportPresentationModal: React.FC<
  ImportPresentationModalProps
> = ({
  isImportModalOpen,
  setIsImportModalOpen,
  handleFileImport,
  importPresentationMutation,
}) => {
  if (!isImportModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-gradient-to-b from-[#2a1f3d] to-[#1a0f2e] border border-[#8356F3]/30 rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[#8356F3]/20 border border-[#8356F3]/30 mb-6">
            <Upload className="w-8 h-8 text-[#8356F3]" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3">
            Import Presentation
          </h3>

          {/* Message */}
          <p className="text-gray-300 mb-6">
            Upload a PowerPoint file (.pptx or .ppt) to import as a new
            Q-worship presentation.
          </p>

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-[#8356F3]/50 rounded-lg p-8 mb-6 hover:border-[#8356F3] transition-colors cursor-pointer"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pptx,.ppt";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  handleFileImport(file);
                }
              };
              input.click();
            }}>
            <div className="text-center">
              <FileText className="w-12 h-12 text-[#8356F3] mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                Click to select file
              </p>
              <p className="text-gray-400 text-sm">
                or drag and drop your PowerPoint file here
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Supports .pptx and .ppt files
              </p>
            </div>
          </div>

          {/* Loading State */}
          {importPresentationMutation.isPending && (
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-[#8356F3]">
                <div className="w-4 h-4 border-2 border-[#8356F3] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Importing presentation...</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setIsImportModalOpen(false)}
              disabled={importPresentationMutation.isPending}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pptx,.ppt";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleFileImport(file);
                  }
                };
                input.click();
              }}
              disabled={importPresentationMutation.isPending}
              className="flex-1 px-6 py-3 bg-[#8356F3] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium">
              Browse Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
