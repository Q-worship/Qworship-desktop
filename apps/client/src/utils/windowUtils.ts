export const isWindowOpen = (win: Window | null | any): win is Window => {
  if (!win) return false;
  try {
    return !win.closed;
  } catch (e) {
    return true; 
  }
};
