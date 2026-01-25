'use client';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="max-w-lg mx-auto flex justify-around">
        <NavItem
          icon={currentPage === 'main' ? '🏠' : '🏡'}
          label="Home"
          active={currentPage === 'main'}
          onClick={() => onNavigate('main')}
        />
        <NavItem
          icon={currentPage === 'settings' ? '⚙️' : '🔧'}
          label="Settings"
          active={currentPage === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </div>
    </nav>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-6 rounded-lg transition ${
        active 
          ? 'text-indigo-500' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className={`text-xs ${active ? 'font-medium' : ''}`}>{label}</span>
    </button>
  );
}
