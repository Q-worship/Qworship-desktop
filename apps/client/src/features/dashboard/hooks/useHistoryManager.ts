import { useState, useEffect } from "react";

export interface ActionHistoryItem {
  type: "ADD_ITEM" | "REMOVE_ITEM" | "EDIT_ITEM" | "MOVE_ITEM";
  itemId?: string;
  sectionName?: string;
  item?: any;
  previousItem?: any;
  timestamp: number;
  description: string;
}

// Exported to be used by other components if needed
export const getServiceSectionKey = (
  sectionName: string,
): "pre-service" | "warm-up" | "service" | "post-service" => {
  switch (sectionName) {
    case "PRE-SERVICE ITEMS":
      return "pre-service";
    case "WARM - UP":
      return "warm-up";
    case "SERVICE ITEMS":
      return "service";
    case "POST SERVICE LOOP":
      return "post-service";
    default:
      return "service";
  }
};

export interface UseHistoryManagerProps {
  setSectionItems: React.Dispatch<
    React.SetStateAction<{ [key: string]: any[] }>
  >;
  setServiceItems: React.Dispatch<React.SetStateAction<any[]>>;
  setInsertedItems: React.Dispatch<React.SetStateAction<any[]>>;
  editingContent: any;
  setEditingContent: React.Dispatch<React.SetStateAction<any>>;
  setSelectedContentType: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentSongTitle: React.Dispatch<React.SetStateAction<string>>;
}

export const useHistoryManager = ({
  setSectionItems,
  setServiceItems,
  setInsertedItems,
  editingContent,
  setEditingContent,
  setSelectedContentType,
  setCurrentSongTitle,
}: UseHistoryManagerProps) => {
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [actionHistoryIndex, setActionHistoryIndex] = useState(-1);

  // Function to record an action in history
  const recordAction = (action: Omit<ActionHistoryItem, "timestamp">) => {
    const actionWithTimestamp: ActionHistoryItem = {
      ...action,
      timestamp: Date.now(),
    };

    setActionHistory((prev) => {
      // Remove any future history after current index
      const newHistory = prev.slice(0, actionHistoryIndex + 1);
      // Add new action
      newHistory.push(actionWithTimestamp);
      // Limit history to 50 actions
      return newHistory.slice(-50);
    });

    setActionHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  // Function to perform undo - reverses the last action
  const performUndo = () => {
    if (actionHistoryIndex >= 0) {
      const lastAction = actionHistory[actionHistoryIndex];

      switch (lastAction.type) {
        case "ADD_ITEM":
          // Undo add by removing the item
          if (lastAction.itemId && lastAction.sectionName) {
            setSectionItems((prev) => ({
              ...prev,
              [lastAction.sectionName!]: (
                prev[lastAction.sectionName!] || []
              ).filter((item) => item.id !== lastAction.itemId),
            }));
            setServiceItems((prev) =>
              prev.filter((item) => item.id !== lastAction.itemId),
            );
            setInsertedItems((prev) =>
              prev.filter((item) => item.id !== lastAction.itemId),
            );

            // Clear editing state if the undone item was being edited
            if (editingContent?.id === lastAction.itemId) {
              setEditingContent(null);
              setSelectedContentType(null);
              setCurrentSongTitle("");
            }
          }
          break;

        case "REMOVE_ITEM":
          // Undo remove by adding the item back
          if (lastAction.item && lastAction.sectionName) {
            setSectionItems((prev) => ({
              ...prev,
              [lastAction.sectionName!]: [
                ...(prev[lastAction.sectionName!] || []),
                lastAction.item,
              ],
            }));

            // Recreate the service item with slides
            const restoredServiceItem = {
              id: lastAction.item.id,
              section: getServiceSectionKey(lastAction.sectionName),
              type: lastAction.item.type,
              title: lastAction.item.title,
              content: lastAction.item.content || {},
              slides: [
                {
                  id: `slide-${lastAction.item.id}-${Date.now()}`,
                  type:
                    lastAction.item.type === "song"
                      ? ("song" as const)
                      : ("custom" as const),
                  title: lastAction.item.title,
                  content:
                    lastAction.item.type === "song"
                      ? "Please select a song"
                      : "Ready for content",
                  sectionLabel:
                    lastAction.item.type === "song" ? "Song" : "Content",
                },
              ],
            };

            setServiceItems((prev) => [...prev, restoredServiceItem]);
            setInsertedItems((prev) => [...prev, lastAction.item]);
          }
          break;
      }

      setActionHistoryIndex((prev) => prev - 1);
    }
  };

  // Function to perform redo - replays the next action
  const performRedo = () => {
    if (actionHistoryIndex < actionHistory.length - 1) {
      const nextAction = actionHistory[actionHistoryIndex + 1];

      switch (nextAction.type) {
        case "ADD_ITEM":
          // Redo add by adding the item again
          if (nextAction.item && nextAction.sectionName) {
            setSectionItems((prev) => ({
              ...prev,
              [nextAction.sectionName!]: [
                ...(prev[nextAction.sectionName!] || []),
                nextAction.item,
              ],
            }));

            const serviceItem = {
              id: nextAction.item.id,
              section: getServiceSectionKey(nextAction.sectionName),
              type: nextAction.item.type,
              title: nextAction.item.title,
              content: nextAction.item.content || {},
              slides: [
                {
                  id: `slide-${nextAction.item.id}-${Date.now()}`,
                  type:
                    nextAction.item.type === "song"
                      ? ("song" as const)
                      : ("custom" as const),
                  title: nextAction.item.title,
                  content:
                    nextAction.item.type === "song"
                      ? "Please select a song"
                      : "Ready for content",
                  sectionLabel:
                    nextAction.item.type === "song" ? "Song" : "Content",
                },
              ],
            };

            setServiceItems((prev) => [...prev, serviceItem]);
            setInsertedItems((prev) => [...prev, nextAction.item]);
          }
          break;

        case "REMOVE_ITEM":
          // Redo remove by removing the item again
          if (nextAction.itemId && nextAction.sectionName) {
            setSectionItems((prev) => ({
              ...prev,
              [nextAction.sectionName!]: (
                prev[nextAction.sectionName!] || []
              ).filter((item) => item.id !== nextAction.itemId),
            }));
            setServiceItems((prev) =>
              prev.filter((item) => item.id !== nextAction.itemId),
            );
            setInsertedItems((prev) =>
              prev.filter((item) => item.id !== nextAction.itemId),
            );

            if (editingContent?.id === nextAction.itemId) {
              setEditingContent(null);
              setSelectedContentType(null);
              setCurrentSongTitle("");
            }
          }
          break;
      }

      setActionHistoryIndex((prev) => prev + 1);
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        performUndo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        performRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionHistoryIndex, actionHistory, performUndo, performRedo]);

  return {
    actionHistory,
    setActionHistory,
    actionHistoryIndex,
    setActionHistoryIndex,
    recordAction,
    performUndo,
    performRedo,
  };
};
