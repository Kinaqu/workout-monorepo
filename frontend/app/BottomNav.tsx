export type TabId = 'today' | 'history' | 'program';

const NAV_ITEMS: Array<{ tab: TabId; label: string; icon: React.ReactNode }> = [
  {
    tab: 'today',
    label: 'Today',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"></path>
        <path d="m2.5 21.5 1.4-1.4"></path>
        <path d="m20.1 3.9 1.4-1.4"></path>
        <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"></path>
        <path d="m9.6 14.4 4.8-4.8"></path>
      </svg>
    ),
  },
  {
    tab: 'history',
    label: 'History',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
        <path d="M12 7v5l4 2"></path>
      </svg>
    ),
  },
  {
    tab: 'program',
    label: 'Plan',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6h4"></path>
        <path d="M2 10h4"></path>
        <path d="M2 14h4"></path>
        <path d="M2 18h4"></path>
        <rect width="16" height="20" x="4" y="2" rx="2"></rect>
        <path d="M9.5 8h5"></path>
        <path d="M9.5 12H16"></path>
        <path d="M9.5 16H14"></path>
      </svg>
    ),
  },
];

export function BottomNav({
  visible,
  activeTab,
  onSelect,
}: {
  visible: boolean;
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}) {
  return (
    <nav id="app-nav" className={`bottom-nav${visible ? '' : ' hidden'}`}>
      {NAV_ITEMS.map(item => (
        <div
          className={`nav-item${item.tab === activeTab ? ' active' : ''}`}
          data-tab={item.tab}
          key={item.tab}
          onClick={() => {
            if (visible) {
              onSelect(item.tab);
            }
          }}
        >
          <div className="nav-icon" aria-hidden="true">
            {item.icon}
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
