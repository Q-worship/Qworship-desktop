import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, Download, CheckCircle, FileCode, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import qworshipLogo from "@assets/Group 1_1754122708985.png";

interface DocFile {
  filename: string;
  title: string;
  description: string;
  size: string;
}

export function DocsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const { data: docsData, isLoading } = useQuery<{ success: boolean; documents: DocFile[] }>({
    queryKey: ["/api/docs/list"],
  });

  const handleDownload = async (filename: string, format: 'md' | 'word') => {
    const downloadKey = `${filename}-${format}`;
    setDownloadingFile(downloadKey);
    try {
      const endpoint = format === 'word' 
        ? `/api/docs/download-word/${filename}`
        : `/api/docs/download/${filename}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === 'word' ? filename.replace('.md', '.docx') : filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      const formatLabel = format === 'word' ? 'Word' : 'Markdown';
      toast({
        title: "Download Started",
        description: `${formatLabel} file is being downloaded.`,
        className: "bg-green-600 text-white",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0920] text-white" data-testid="docs-page">
      <header className="sticky top-0 z-50 bg-[#0f0920]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/qworship-home")}
                className="text-gray-400 hover:text-white hover:bg-[#2a1f4b]"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <img 
              src={qworshipLogo} 
              alt="Q-worship" 
              className="h-8 object-contain"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-6">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4" data-testid="text-page-title">
            Developer Documentation
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Download technical documentation for the Q-worship platform. Share these files with new developers to help them get started quickly.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1a0f2e] rounded-xl border border-gray-700 p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-700 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {docsData?.documents?.map((doc) => (
              <div
                key={doc.filename}
                className="bg-[#1a0f2e] rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition-colors"
                data-testid={`doc-card-${doc.filename}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white" data-testid={`text-doc-title-${doc.filename}`}>
                        {doc.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 mb-3" data-testid={`text-doc-description-${doc.filename}`}>
                      {doc.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {doc.filename}
                      </span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleDownload(doc.filename, 'word')}
                      disabled={downloadingFile === `${doc.filename}-word`}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid={`button-download-word-${doc.filename}`}
                    >
                      {downloadingFile === `${doc.filename}-word` ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 animate-pulse" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <FileIcon className="w-4 h-4 mr-2" />
                          Word (.docx)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDownload(doc.filename, 'md')}
                      disabled={downloadingFile === `${doc.filename}-md`}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      data-testid={`button-download-md-${doc.filename}`}
                    >
                      {downloadingFile === `${doc.filename}-md` ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 animate-pulse" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <FileCode className="w-4 h-4 mr-2" />
                          Markdown (.md)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!docsData?.documents || docsData.documents.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documentation files available yet.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 bg-[#1a0f2e] rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Quick Start for Developers
          </h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-purple-400 font-mono shrink-0">1.</span>
              <span>Download the <strong className="text-white">SRS document</strong> for complete technical specifications and API documentation</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-mono shrink-0">2.</span>
              <span>Review the <strong className="text-white">Developer Documentation</strong> for architecture overview and coding patterns</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-mono shrink-0">3.</span>
              <span>Check the <strong className="text-white">Project Configuration</strong> file for current project state and user preferences</span>
            </li>
          </ol>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>These documents are generated from the Q-worship codebase and are always up-to-date.</p>
        </div>
      </main>
    </div>
  );
}
