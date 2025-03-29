import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <Button
      variant="default"
      onClick={() => {
        setCount((prev) => prev + 1);
      }}
    >
      Click me {count} hit update
    </Button>
  );
}
