export interface UsePermissionReturn {
  canAskAgain: boolean;
  clearError: () => void;
  error: string | null;
  hasPermission: boolean | null;
  loading: boolean;
  openAppSettings: () => Promise<void>;
  requestPermission: () => Promise<void>;
}
