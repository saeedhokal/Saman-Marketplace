import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const TOKEN_KEY = 'saman_push_token';
const PENDING_TOKEN_KEY = 'saman_pending_push_token';

export function PushDiagnostics() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState({
    platform: 'checking...',
    isNative: false,
    permission: 'checking...',
    storedToken: 'checking...',
    pendingToken: 'checking...',
    serverTokens: 'checking...',
    lastError: null as string | null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkDiagnostics = async () => {
    setIsRefreshing(true);
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    
    let permission = 'N/A (web)';
    let lastError = null;

    if (isNative) {
      try {
        const permStatus = await PushNotifications.checkPermissions();
        permission = permStatus.receive;
      } catch (err: any) {
        permission = 'error';
        lastError = err?.message || 'Permission check failed';
      }
    }

    const storedToken = localStorage.getItem(TOKEN_KEY);
    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);

    let serverTokens = 'N/A';
    try {
      // Use direct fetch to avoid any caching issues
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const res = await response.json();
      serverTokens = `${res.tokens ?? '?'} tokens, ${res.users ?? '?'} users (v${res.version || '?'})`;
    } catch (err: any) {
      serverTokens = 'Fetch Error: ' + (err?.message || String(err));
    }

    setDiagnostics({
      platform,
      isNative,
      permission,
      storedToken: storedToken ? storedToken.substring(0, 20) + '...' : 'none',
      pendingToken: pendingToken ? pendingToken.substring(0, 20) + '...' : 'none',
      serverTokens,
      lastError,
    });
    setIsRefreshing(false);
  };

  const forceRegister = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('Only works on iOS/Android device');
      return;
    }

    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        alert('Registration requested! Check diagnostics in 3 seconds.');
        setTimeout(checkDiagnostics, 3000);
      } else {
        alert('Permission denied: ' + permStatus.receive);
      }
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'Unknown'));
    }
  };

  const testTokenApi = async () => {
    try {
      const testToken = `manual_test_${Date.now()}`;
      const res = await apiRequest('POST', '/api/device-token', {
        fcmToken: testToken,
        deviceOs: 'ios',
        deviceName: 'Manual Test',
      });
      alert('API Response: ' + JSON.stringify(res));
      checkDiagnostics();
    } catch (err: any) {
      alert('API Error: ' + (err?.message || 'Unknown'));
    }
  };

  const registerStoredToken = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      alert('No stored token found!');
      return;
    }
    try {
      const res = await apiRequest('POST', '/api/device-token', {
        fcmToken: storedToken,
        deviceOs: Capacitor.getPlatform(),
        deviceName: `${Capacitor.getPlatform()} device (manual)`,
      });
      alert('Registered! Response: ' + JSON.stringify(res));
      checkDiagnostics();
    } catch (err: any) {
      alert('Register Error: ' + (err?.message || 'Unknown'));
    }
  };

  useEffect(() => {
    checkDiagnostics();
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4 shadow-xl">
      <h3 className="text-white font-bold text-lg mb-3">Push Diagnostics</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Platform:</span>
          <span className="text-white">{diagnostics.platform} {diagnostics.isNative ? '(native)' : '(web)'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Permission:</span>
          <span className={diagnostics.permission === 'granted' ? 'text-green-400' : 'text-yellow-400'}>
            {diagnostics.permission}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Stored Token:</span>
          <span className="text-white font-mono text-xs">{diagnostics.storedToken}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Pending Token:</span>
          <span className="text-white font-mono text-xs">{diagnostics.pendingToken}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Server Status:</span>
          <span className="text-white">{diagnostics.serverTokens}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">User Logged In:</span>
          <span className={user ? 'text-green-400' : 'text-red-400'}>{user ? 'Yes' : 'No'}</span>
        </div>
        {diagnostics.lastError && (
          <div className="text-red-400 text-xs mt-2">Error: {diagnostics.lastError}</div>
        )}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <Button size="sm" onClick={checkDiagnostics} disabled={isRefreshing} data-testid="btn-refresh-diag">
          {isRefreshing ? 'Checking...' : 'Refresh'}
        </Button>
        <Button size="sm" variant="secondary" onClick={forceRegister} data-testid="btn-force-register">
          Force Register
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={registerStoredToken} data-testid="btn-register-token">
          Register Token
        </Button>
        <Button size="sm" variant="outline" onClick={testTokenApi} data-testid="btn-test-api">
          Test API
        </Button>
      </div>
    </div>
  );
}
