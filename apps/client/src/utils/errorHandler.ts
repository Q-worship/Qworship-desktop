// Centralized Error Handling Utility to resolve `unknown` catches

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

export function isAuthError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return msg.includes('401') || msg.includes('not authenticated') || msg.includes('unauthorized');
}

export function formatApiError(error: unknown): { success: false, message: string } {
  return {
    success: false,
    message: getErrorMessage(error)
  };
}
