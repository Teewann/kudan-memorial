import { useLocation } from 'react-router-dom';
import Tabs from '../components/Tabs';
import Families from './Families';
import AddFamily from './AddFamily';

export default function FamiliesPage() {
  const { pathname } = useLocation();
  return (
    <div>
      <Tabs
        active={pathname}
        tabs={[
          { label: 'Families', to: '/families', end: true },
          { label: 'Register a Family', to: '/families/new' },
        ]}
      />
      {pathname === '/families/new' ? <AddFamily /> : <Families />}
    </div>
  );
}