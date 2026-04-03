import { useState, useEffect } from "react";

export function useModalDragging() {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalWidth, setModalWidth] = useState(950);
  const [modalHeight, setModalHeight] = useState(700);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(950);
  const [resizeStartHeight, setResizeStartHeight] = useState(700);

  // Draggable modal positions
  const [backgroundModalPos, setBackgroundModalPos] = useState({
    x: window.innerWidth - 340,
    y: 80,
  });
  const [obsModalPos, setObsModalPos] = useState({
    x: (window.innerWidth - 500) / 2,
    y: 100,
  });
  const [settingsModalPos, setSettingsModalPos] = useState({
    x: window.innerWidth - 420,
    y: 80,
  });
  const [slidesModalPos, setSlidesModalPos] = useState({ x: 100, y: 100 });

  const [draggingModal, setDraggingModal] = useState<
    "background" | "obs" | "settings" | "slides" | null
  >(null);
  const [modalDragOffset, setModalDragOffset] = useState({ x: 0, y: 0 });

  // Main console drag / resize effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (isResizing) {
        const newWidth = resizeStartWidth + (e.clientX - resizeStartX);
        const newHeight = resizeStartHeight + (e.clientY - resizeStartY);
        setModalWidth(Math.max(800, Math.min(1600, newWidth)));
        setModalHeight(Math.max(500, Math.min(950, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStartX,
    resizeStartY,
    resizeStartWidth,
    resizeStartHeight,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if ((e.target as HTMLElement).closest("input")) return;
    if ((e.target as HTMLElement).closest("select")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartY(e.clientY);
    setResizeStartWidth(modalWidth);
    setResizeStartHeight(modalHeight);
  };

  // Toolbar modal dragging effect
  useEffect(() => {
    const handleModalMouseMove = (e: MouseEvent) => {
      if (draggingModal) {
        const newX = e.clientX - modalDragOffset.x;
        const newY = e.clientY - modalDragOffset.y;
        const boundedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        const boundedY = Math.max(0, Math.min(window.innerHeight - 100, newY));

        switch (draggingModal) {
          case "background":
            setBackgroundModalPos({ x: boundedX, y: boundedY });
            break;
          case "obs":
            setObsModalPos({ x: boundedX, y: boundedY });
            break;
          case "settings":
            setSettingsModalPos({ x: boundedX, y: boundedY });
            break;
          case "slides":
            setSlidesModalPos({ x: boundedX, y: boundedY });
            break;
        }
      }
    };

    const handleModalMouseUp = () => {
      setDraggingModal(null);
    };

    if (draggingModal) {
      document.addEventListener("mousemove", handleModalMouseMove);
      document.addEventListener("mouseup", handleModalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleModalMouseMove);
      document.removeEventListener("mouseup", handleModalMouseUp);
    };
  }, [draggingModal, modalDragOffset]);

  const startModalDrag = (
    modal: "background" | "obs" | "settings" | "slides",
    e: React.MouseEvent,
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if ((e.target as HTMLElement).closest("input")) return;
    if ((e.target as HTMLElement).closest("select")) return;

    let currentPos = { x: 0, y: 0 };
    switch (modal) {
      case "background":
        currentPos = backgroundModalPos;
        break;
      case "obs":
        currentPos = obsModalPos;
        break;
      case "settings":
        currentPos = settingsModalPos;
        break;
      case "slides":
        currentPos = slidesModalPos;
        break;
    }

    setDraggingModal(modal);
    setModalDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
  };

  return {
    position,
    modalWidth,
    modalHeight,
    backgroundModalPos,
    obsModalPos,
    settingsModalPos,
    slidesModalPos,
    handleMouseDown,
    handleResizeStart,
    startModalDrag,
  };
}
