import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeedbackButtonProps {
  contentType: 'faq' | 'article';
  contentId: string | number;
  className?: string;
}

export function FeedbackButton({ contentType, contentId, className = '' }: FeedbackButtonProps) {
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const { toast } = useToast();

  const feedbackMutation = useMutation({
    mutationFn: async ({ isHelpful }: { isHelpful: boolean }) => {
      return apiRequest('POST', '/api/help/feedback', {
        contentType,
        contentId: parseInt(contentId.toString()),
        isHelpful,
        userId: null // Anonymous feedback for now
      });
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our content.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      setFeedback(null); // Reset on error
    }
  });

  const handleFeedback = (isHelpful: boolean) => {
    if (feedback !== null) return; // Prevent multiple submissions
    
    setFeedback(isHelpful);
    feedbackMutation.mutate({ isHelpful });
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <span className="text-sm text-gray-400">Was this helpful?</span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleFeedback(true)}
          disabled={feedback !== null || feedbackMutation.isPending}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            feedback === true
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : feedback === false
              ? 'border-gray-600 text-gray-500 cursor-not-allowed'
              : 'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">Yes</span>
        </button>
        
        <button
          onClick={() => handleFeedback(false)}
          disabled={feedback !== null || feedbackMutation.isPending}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            feedback === false
              ? 'bg-red-500/20 border-red-500 text-red-400'
              : feedback === true
              ? 'border-gray-600 text-gray-500 cursor-not-allowed'
              : 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm">No</span>
        </button>
      </div>
    </div>
  );
}