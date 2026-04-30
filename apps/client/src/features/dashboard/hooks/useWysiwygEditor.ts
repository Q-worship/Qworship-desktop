import { useState, useRef, useEffect } from "react";

export interface EditorState {
  selectedFont: string;
  selectedHeading: string;
  selectedStyle: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  fontSize: string;
  textColor: string;
  textAlign: string;
  // Style properties
  styleColor: string | null;
  styleTextShadow: string | null;
  styleFontFamily: string | null;
  styleLetterSpacing: string | null;
  styleTextTransform: string | null;
  styleTextDecoration: string | null;
  listType: string;
  canUndo: boolean;
  canRedo: boolean;
}

export interface TitleEditorState {
  selectedFont: string;
  selectedHeading: string;
  selectedStyle: string;
  fontSize: string;
  textColor: string;
  textAlign: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  styleColor: string | null;
  styleTextShadow: string | null;
  styleFontFamily: string | null;
  styleLetterSpacing: string | null;
  styleTextTransform: string | null;
  styleTextDecoration: string | null;
}

export interface UseWysiwygEditorProps {
  onContentChange: (content: string, textarea: HTMLTextAreaElement) => void;
  onUndoRedo: (newContent: string) => void;
}

export const useWysiwygEditor = ({
  onContentChange,
  onUndoRedo,
}: UseWysiwygEditorProps) => {
  const [editorState, setEditorState] = useState<EditorState>({
    selectedFont: "Lufgord",
    selectedHeading: "Heading 1",
    selectedStyle: "Styles",
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    fontSize: "16px",
    textColor: "#ffffff",
    textAlign: "left",
    styleColor: null,
    styleTextShadow: null,
    styleFontFamily: null,
    styleLetterSpacing: null,
    styleTextTransform: null,
    styleTextDecoration: null,
    listType: "none",
    canUndo: false,
    canRedo: false,
  });

  const [titleEditorState, setTitleEditorState] = useState<TitleEditorState>({
    selectedFont: "Lufgord",
    selectedHeading: "Paragraph",
    selectedStyle: "None",
    fontSize: "18px",
    textColor: "#ffffff",
    textAlign: "left",
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    styleColor: null,
    styleTextShadow: null,
    styleFontFamily: null,
    styleLetterSpacing: null,
    styleTextTransform: null,
    styleTextDecoration: null,
  });

  const [activeTextarea, setActiveTextarea] =
    useState<HTMLTextAreaElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [editorHistory, setEditorHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = (content: string) => {
    if (editorHistory[historyIndex] === content) return;

    const newHistory = editorHistory.slice(0, historyIndex + 1);
    newHistory.push(content);

    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setEditorHistory(newHistory);
    setEditorState((prev) => ({
      ...prev,
      canUndo: newHistory.length > 1,
      canRedo: false,
    }));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newContent = editorHistory[newIndex];
      onUndoRedo(newContent);

      setEditorState((prev) => ({
        ...prev,
        canRedo: true,
        canUndo: newIndex > 0,
      }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < editorHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newContent = editorHistory[newIndex];
      onUndoRedo(newContent);

      setEditorState((prev) => ({
        ...prev,
        canUndo: true,
        canRedo: newIndex < editorHistory.length - 1,
      }));
    }
  };

  const applyStylesToTextarea = (
    textarea: HTMLTextAreaElement,
    styles: TitleEditorState | EditorState,
  ) => {
    const style = textarea.style;

    style.fontFamily =
      (styles as any).styleFontFamily || styles.selectedFont || "Lufgord";
    style.fontSize = styles.fontSize || "16px";
    style.color = (styles as any).styleColor || styles.textColor || "#ffffff";
    style.textAlign = styles.textAlign || "left";
    style.fontWeight = styles.isBold ? "bold" : "normal";
    style.fontStyle = styles.isItalic ? "italic" : "normal";
    style.textDecoration =
      `${styles.isUnderline ? "underline" : ""} ${styles.isStrikethrough ? "line-through" : ""} ${(styles as any).styleTextDecoration || ""}`.trim() ||
      "none";
    style.textShadow = (styles as any).styleTextShadow || "";
    style.letterSpacing = (styles as any).styleLetterSpacing || "";
    style.textTransform = (styles as any).styleTextTransform || "";
  };

  const applyWYSIWYGStyle = (editorStateToUpdate: any, styleName: string) => {
    editorStateToUpdate.styleColor = null;
    editorStateToUpdate.styleTextShadow = null;
    editorStateToUpdate.styleFontFamily = null;
    editorStateToUpdate.styleLetterSpacing = null;
    editorStateToUpdate.styleTextTransform = null;
    editorStateToUpdate.styleTextDecoration = null;

    switch (styleName) {
      case "MODERN GLOW":
        editorStateToUpdate.styleColor = "#22d3ee";
        editorStateToUpdate.styleTextShadow = "0 0 10px #22d3ee";
        editorStateToUpdate.isBold = true;
        break;
      case "RETRO WAVE":
        editorStateToUpdate.styleColor = "#ec4899";
        editorStateToUpdate.styleTextShadow = "0 0 8px #ec4899";
        editorStateToUpdate.isBold = true;
        break;
      case "MINIMAL LIGHT":
        editorStateToUpdate.styleColor = "#d1d5db";
        editorStateToUpdate.styleLetterSpacing = "2px";
        break;
      case "SUNDAY SERIF":
        editorStateToUpdate.styleColor = "#fbbf24";
        editorStateToUpdate.styleFontFamily = "serif";
        break;
      case "URBAN PRAISE":
        editorStateToUpdate.styleColor = "#fbbf24";
        editorStateToUpdate.styleTextTransform = "uppercase";
        editorStateToUpdate.isBold = true;
        break;
      case "Heavenly Script":
        editorStateToUpdate.styleColor = "#d1d5db";
        editorStateToUpdate.styleFontFamily = "cursive";
        editorStateToUpdate.isItalic = true;
        break;
      case "MIDNIGHT FADE":
        editorStateToUpdate.styleColor = "#9ca3af";
        editorStateToUpdate.isBold = true;
        break;
      case "SUNRISE BOLD":
        editorStateToUpdate.styleColor = "#fbbf24";
        editorStateToUpdate.styleTextShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        editorStateToUpdate.isBold = true;
        break;
      case "GRACE OUTLINE":
        editorStateToUpdate.styleColor = "transparent";
        editorStateToUpdate.styleTextDecoration =
          "-webkit-text-stroke: 1px #ffffff";
        break;
      case "None":
      default:
        break;
    }
  };

  const applyListFormatting = (
    textarea: HTMLTextAreaElement,
    listType: "bullet" | "numbered",
  ) => {
    const content = textarea.value;
    const lines = content.split("\n");
    const cursorPosition = textarea.selectionStart;

    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursorPosition) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }

    const currentLine = lines[currentLineIndex];
    let newLine = "";

    if (listType === "bullet") {
      if (currentLine.startsWith("• ")) {
        newLine = currentLine.substring(2);
      } else {
        newLine = "• " + currentLine;
      }
    } else if (listType === "numbered") {
      const numberMatch = currentLine.match(/^\d+\.\s/);
      if (numberMatch) {
        newLine = currentLine.substring(numberMatch[0].length);
      } else {
        let nextNum = 1;
        for (let i = currentLineIndex - 1; i >= 0; i--) {
          const match = lines[i].match(/^(\d+)\.\s/);
          if (match) {
            nextNum = parseInt(match[1]) + (currentLineIndex - i);
            break;
          }
        }
        newLine = `${nextNum}. ` + currentLine;
      }
    }

    lines[currentLineIndex] = newLine;
    const newContent = lines.join("\n");

    textarea.value = newContent;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    const newCursorPos = cursorPosition + (newLine.length - currentLine.length);
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  };

  const applyFormatting = (formatType: string, value?: string) => {
    const textarea = activeTextarea || textAreaRef.current;
    if (!textarea) return;

    const isTitleField = textarea.getAttribute("data-title-field") === "true";

    if (isTitleField) {
      const newTitleEditorState = { ...titleEditorState };

      switch (formatType) {
        case "bold":
          newTitleEditorState.isBold = !newTitleEditorState.isBold;
          break;
        case "italic":
          newTitleEditorState.isItalic = !newTitleEditorState.isItalic;
          break;
        case "underline":
          newTitleEditorState.isUnderline = !newTitleEditorState.isUnderline;
          break;
        case "strikethrough":
          newTitleEditorState.isStrikethrough =
            !newTitleEditorState.isStrikethrough;
          break;
        case "font":
          newTitleEditorState.selectedFont = value || "Lufgord";
          break;
        case "fontSize":
          newTitleEditorState.fontSize = value || "18px";
          break;
        case "color":
          newTitleEditorState.textColor = value || "#ffffff";
          break;
        case "align-left":
          newTitleEditorState.textAlign = "left";
          break;
        case "align-center":
          newTitleEditorState.textAlign = "center";
          break;
        case "align-right":
          newTitleEditorState.textAlign = "right";
          break;
        case "align-justify":
          newTitleEditorState.textAlign = "justify";
          break;
        case "heading": {
          newTitleEditorState.selectedHeading = value || "Paragraph";
          const headingSizes = {
            "Heading 1": "24px",
            "Heading 2": "20px",
            "Heading 3": "18px",
            Paragraph: "16px",
          };
          newTitleEditorState.fontSize =
            headingSizes[value as keyof typeof headingSizes] || "16px";
          break;
        }
        case "style":
          newTitleEditorState.selectedStyle = value || "None";
          applyWYSIWYGStyle(newTitleEditorState, value || "None");
          break;
        case "bulletList":
          applyListFormatting(textarea, "bullet");
          break;
        case "numberedList":
          applyListFormatting(textarea, "numbered");
          break;
      }

      setTitleEditorState(newTitleEditorState);
      applyStylesToTextarea(textarea, newTitleEditorState);
    } else {
      const newEditorState = { ...editorState };

      switch (formatType) {
        case "bold":
          newEditorState.isBold = !newEditorState.isBold;
          break;
        case "italic":
          newEditorState.isItalic = !newEditorState.isItalic;
          break;
        case "underline":
          newEditorState.isUnderline = !newEditorState.isUnderline;
          break;
        case "strikethrough":
          newEditorState.isStrikethrough = !newEditorState.isStrikethrough;
          break;
        case "font":
          newEditorState.selectedFont = value || "Lufgord";
          break;
        case "fontSize":
          newEditorState.fontSize = value || "16px";
          break;
        case "color":
          newEditorState.textColor = value || "#ffffff";
          break;
        case "align-left":
          newEditorState.textAlign = "left";
          break;
        case "align-center":
          newEditorState.textAlign = "center";
          break;
        case "align-right":
          newEditorState.textAlign = "right";
          break;
        case "align-justify":
          newEditorState.textAlign = "justify";
          break;
        case "heading": {
          newEditorState.selectedHeading = value || "Paragraph";
          const headingSizes = {
            "Heading 1": "22px",
            "Heading 2": "18px",
            "Heading 3": "16px",
            Paragraph: "14px",
          };
          newEditorState.fontSize =
            headingSizes[value as keyof typeof headingSizes] || "14px";
          break;
        }
        case "style":
          newEditorState.selectedStyle = value || "None";
          applyWYSIWYGStyle(newEditorState, value || "None");
          break;
        case "bulletList":
          applyListFormatting(textarea, "bullet");
          newEditorState.listType =
            newEditorState.listType === "bullet" ? "none" : "bullet";
          break;
        case "numberedList":
          applyListFormatting(textarea, "numbered");
          newEditorState.listType =
            newEditorState.listType === "numbered" ? "none" : "numbered";
          break;
      }

      setEditorState(newEditorState);
      applyStylesToTextarea(textarea, newEditorState);
      onContentChange(textarea.value, textarea);
    }
  };

  const applyTextAlign = (alignment: string) => {
    setEditorState((prev) => ({ ...prev, textAlign: alignment }));
    if (textAreaRef.current) {
      textAreaRef.current.style.textAlign = alignment;
    }
  };

  const insertTextAtCursor = (textToInsert: string) => {
    if (!textAreaRef.current) return;

    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const newContent = beforeText + textToInsert + afterText;
    textarea.value = newContent;

    onContentChange(newContent, textarea);
    addToHistory(newContent);

    setTimeout(() => {
      if (textAreaRef.current) {
        const newCursorPos = start + textToInsert.length;
        textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textAreaRef.current.focus();
      }
    }, 0);
  };

  const applyFontSize = (size: string) => {
    setEditorState((prev) => ({ ...prev, fontSize: size }));
    if (textAreaRef.current) {
      textAreaRef.current.style.fontSize = size;
    }
  };

  const applyTextColor = (color: string) => {
    setEditorState((prev) => ({ ...prev, textColor: color }));
    if (textAreaRef.current) {
      textAreaRef.current.style.color = color;
    }
  };

  const applyFontFamily = (fontFamily: string) => {
    const textarea = activeTextarea || textAreaRef.current;
    if (!textarea) return;

    const isTitleField = textarea.getAttribute("data-title-field") === "true";

    if (isTitleField) {
      setTitleEditorState((prev) => ({ ...prev, selectedFont: fontFamily }));
      textarea.style.fontFamily = fontFamily;
    } else {
      setEditorState((prev) => ({ ...prev, selectedFont: fontFamily }));
      textarea.style.fontFamily = fontFamily;
      onContentChange(textarea.value, textarea);
    }
  };

  const applyVisualStyleToTextarea = (
    textarea: HTMLTextAreaElement,
    styleName: string,
  ) => {
    const style = textarea.style;

    style.background = "";
    style.border = "";
    style.textShadow = "";

    switch (styleName) {
      case "Bold Title":
        style.fontWeight = "bold";
        style.fontSize = "20px";
        break;
      case "Subtitle":
        style.fontStyle = "italic";
        style.fontSize = "16px";
        style.opacity = "0.9";
        break;
      case "Emphasis":
        style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
        style.fontWeight = "600";
        break;
      case "Highlight":
        style.background = "rgba(131, 86, 243, 0.2)";
        style.padding = "2px 4px";
        style.borderRadius = "3px";
        break;
      case "Verse":
        style.fontFamily = "serif";
        style.lineHeight = "1.6";
        break;
      case "Chorus":
        style.fontWeight = "bold";
        style.letterSpacing = "0.5px";
        break;
      default:
        break;
    }
  };

  const applyVisualStyle = (styleName: string, closeDropdown: () => void) => {
    if (!activeTextarea) return;

    const textarea = activeTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let styledText = "";
    let textareaStyle = {
      color: "",
      textShadow: "",
      fontFamily: "",
      fontWeight: "",
      fontStyle: "",
      letterSpacing: "",
      textTransform: "",
      WebkitTextStroke: "",
    };

    switch (styleName) {
      case "MODERN GLOW":
        styledText = selectedText
          ? `<span style="color: #22d3ee; text-shadow: 0 0 10px #22d3ee; font-weight: bold;">${selectedText}</span>`
          : '<span style="color: #22d3ee; text-shadow: 0 0 10px #22d3ee; font-weight: bold;">MODERN GLOW</span>';
        textareaStyle = {
          color: "#22d3ee",
          textShadow: "0 0 10px #22d3ee",
          fontWeight: "bold",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "RETRO WAVE":
        styledText = selectedText
          ? `<span style="color: #ec4899; font-weight: bold; text-shadow: 0 0 8px #ec4899;">${selectedText}</span>`
          : '<span style="color: #ec4899; font-weight: bold; text-shadow: 0 0 8px #ec4899;">RETRO WAVE</span>';
        textareaStyle = {
          color: "#ec4899",
          textShadow: "0 0 8px #ec4899",
          fontWeight: "bold",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "MINIMAL LIGHT":
        styledText = selectedText
          ? `<span style="color: #d1d5db; font-weight: 300; letter-spacing: 2px;">${selectedText}</span>`
          : '<span style="color: #d1d5db; font-weight: 300; letter-spacing: 2px;">MINIMAL LIGHT</span>';
        textareaStyle = {
          color: "#d1d5db",
          fontWeight: "300",
          letterSpacing: "2px",
          textShadow: "",
          fontFamily: "",
          fontStyle: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "SUNDAY SERIF":
        styledText = selectedText
          ? `<span style="color: #d4af37; font-family: Georgia, serif; font-weight: bold;">${selectedText}</span>`
          : '<span style="color: #d4af37; font-family: Georgia, serif; font-weight: bold;">SUNDAY SERIF</span>';
        textareaStyle = {
          color: "#d4af37",
          fontFamily: "Georgia, serif",
          fontWeight: "bold",
          textShadow: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "URBAN PRAISE":
        styledText = selectedText
          ? `<span style="color: #fbbf24; font-weight: 900; text-transform: uppercase;">${selectedText}</span>`
          : '<span style="color: #fbbf24; font-weight: 900; text-transform: uppercase;">URBAN PRAISE</span>';
        textareaStyle = {
          color: "#fbbf24",
          fontWeight: "900",
          textTransform: "uppercase",
          textShadow: "",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          WebkitTextStroke: "",
        };
        break;
      case "Heavenly Script":
        styledText = selectedText
          ? `<span style="color: #d1d5db; font-family: cursive; font-style: italic;">${selectedText}</span>`
          : '<span style="color: #d1d5db; font-family: cursive; font-style: italic;">Heavenly Script</span>';
        textareaStyle = {
          color: "#d1d5db",
          fontFamily: "cursive",
          fontStyle: "italic",
          textShadow: "",
          fontWeight: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "MIDNIGHT FADE":
        styledText = selectedText
          ? `<span style="color: #9ca3af; font-weight: bold; opacity: 0.8;">${selectedText}</span>`
          : '<span style="color: #9ca3af; font-weight: bold; opacity: 0.8;">MIDNIGHT FADE</span>';
        textareaStyle = {
          color: "#9ca3af",
          fontWeight: "bold",
          textShadow: "",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "SUNRISE BOLD":
        styledText = selectedText
          ? `<span style="color: #fbbf24; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${selectedText}</span>`
          : '<span style="color: #fbbf24; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">SUNRISE BOLD</span>';
        textareaStyle = {
          color: "#fbbf24",
          fontWeight: "900",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
        break;
      case "GRACE OUTLINE":
        styledText = selectedText
          ? `<span style="color: transparent; -webkit-text-stroke: 1px #d1d5db; font-weight: bold;">${selectedText}</span>`
          : '<span style="color: transparent; -webkit-text-stroke: 1px #d1d5db; font-weight: bold;">GRACE OUTLINE</span>';
        textareaStyle = {
          color: "transparent",
          WebkitTextStroke: "1px #d1d5db",
          fontWeight: "bold",
          textShadow: "",
          fontFamily: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
        };
        break;
      default:
        styledText = selectedText;
        textareaStyle = {
          color: "",
          textShadow: "",
          fontFamily: "",
          fontWeight: "",
          fontStyle: "",
          letterSpacing: "",
          textTransform: "",
          WebkitTextStroke: "",
        };
    }

    Object.assign(textarea.style, textareaStyle);

    const newContent = beforeText + styledText + afterText;
    textarea.value = newContent;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    onContentChange(newContent, textarea);
    addToHistory(newContent);

    setEditorState((prev) => ({ ...prev, selectedStyle: styleName }));
    closeDropdown();

    setTimeout(() => {
      const newCursorPos = start + styledText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return {
    editorState,
    setEditorState,
    titleEditorState,
    setTitleEditorState,
    activeTextarea,
    setActiveTextarea,
    textAreaRef,
    titleTextAreaRef,
    editorHistory,
    setEditorHistory,
    historyIndex,
    setHistoryIndex,
    addToHistory,
    handleUndo,
    handleRedo,
    applyFormatting,
    applyTextAlign,
    insertTextAtCursor,
    applyFontSize,
    applyTextColor,
    applyFontFamily,
    applyVisualStyleToTextarea,
    applyVisualStyle,
    applyStylesToTextarea,
    applyListFormatting,
  };
};
