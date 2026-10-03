import { useLocation } from 'react-router-dom';
import Tabs from '../components/Tabs';
import DeceasedList from './DeceasedList';
import AddDeceased from './AddDeceased';

export default function DeceasedPage() {
  const { pathname } = useLocation();
  return (
    <div>
      <Tabs
        active={pathname}
        tabs={[
          { label: 'Register', to: '/deceased', end: true },
          { label: 'Add a Deceased', to: '/deceased/new' },
        ]}
      />
      {pathname === '/deceased/new' ? <AddDeceased /> : <DeceasedList />}
    </div>
  );
}