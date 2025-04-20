import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { TokenManager } from '../utils/tokenManager';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!TokenManager.hasValidTokens()) {
      router.replace('/login');
      return;
    }

    const checkAuth = async () => {
      const token = await TokenManager.getValidAccessToken();
      if (!token) {
        TokenManager.clearTokens();
        router.replace('/login');
      } else {
        router.replace('/requests');
      }
    };
    checkAuth();
  }, [router]);

  return null; 
}