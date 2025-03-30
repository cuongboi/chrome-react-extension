import { GithubIcon, LogOutIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTokenStore } from '@/storage/token';

export function App() {
  const { token, setToken } = useTokenStore();

  return (
    <main className="p-5 bg-background rounded-lg">
      {token ? (
        <Button
          variant="outline"
          className="w-60"
          onClick={() => {
            setToken('');
            window.close();
          }}
        >
          <LogOutIcon />
          <span>Logout</span>
        </Button>
      ) : (
        <Button
          className="w-60"
          onClick={() => {
            const newWindow = window.open(
              'https://github-login.megit.workers.dev/login',
              'popup',
              'width=500,height=600',
            );

            if (newWindow) {
              newWindow.focus();
            } else {
              console.error('Failed to open new window');
            }

            window.addEventListener('message', (event) => {
              if (event.data.accessToken) {
                setToken(event.data.accessToken);
                window.close();
              }
            });
          }}
        >
          <GithubIcon />
          <span>Github Login</span>
        </Button>
      )}
    </main>
  );
}
