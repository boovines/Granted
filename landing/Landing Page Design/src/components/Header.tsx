import { Button } from './ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4" style={{ backgroundColor: 'rgba(173, 160, 125, 0.7)' }}>
      <div className="w-full flex justify-end">
        <Button 
          className="bg-background hover:bg-background/90 text-foreground px-6 py-2"
        >
          Try Free
        </Button>
      </div>
    </header>
  );
}
