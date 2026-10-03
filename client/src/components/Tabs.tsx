import { Link } from 'react-router-dom';

export interface TabDef {
  label: string;
  to: string;
  end?: boolean;
}

export default function Tabs({ tabs, active }: { tabs: TabDef[]; active: string }) {
  return (
    <div className="tabs">
      {tabs.map((t) => {
        const isActive = t.end ? active === t.to : active.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`tab${isActive ? ' active' : ''}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}