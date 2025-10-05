import { Button } from './ui/button';

interface HeaderProps {
  onNavigateToApp: () => void;
}

export function Header({ onNavigateToApp }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4 bg-app-gold/70">
      <div className="w-full flex justify-end pr-16">
        <Button 
          className="px-6 py-2 text-white bg-[#2C3E50] border-none hover:bg-[#34495E]"
          onClick={onNavigateToApp}
        >
          Try Free
        </Button>
      </div>
    </header>
  );
}
