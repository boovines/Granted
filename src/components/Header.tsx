import { Button } from './ui/button';

interface HeaderProps {
  onNavigateToApp: () => void;
}

export function Header({ onNavigateToApp }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4" style={{ backgroundColor: 'rgba(173, 160, 125, 0.7)' }}>
      <div className="w-full flex justify-end" style={{ paddingRight: '4rem' }}>
                <Button
                  className="px-6 py-2 text-white cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: '#2C3E50',
                    border: 'none'
                  }}
                  onClick={onNavigateToApp}
                >
                  Try Free
                </Button>
      </div>
    </header>
  );
}
