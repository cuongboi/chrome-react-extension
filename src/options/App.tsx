import { useProjectStore } from '@/storage/project';

export default function App() {
  const { items } = useProjectStore();
  console.log(items);

  return <h1 className="text-5xl">Test XX</h1>;
}
