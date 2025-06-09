import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { TokenManager } from '../utils/tokenManager';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await TokenManager.getValidAccessToken();
      if (token.type === 'Error') {
        router.replace('/login');
      } else {
        router.replace('/requests');
      }
    };
    checkAuth();
  }, [router]);

  return null; 
}