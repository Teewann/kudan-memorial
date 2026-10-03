import { useLocation } from 'react-router-dom';
import Tabs from '../components/Tabs';
import Announcements from './Announcements';
import AddAnnouncement from './AddAnnouncement';
import { isLoggedIn } from '../lib/api';

export default function AnnouncementsPage() {
  const { pathname } = useLocation();
  const loggedIn = isLoggedIn();

  const tabs = loggedIn
    ? [
        { label: 'Announcements', to: '/announcements', end: true },
        { label: 'Post Announcement', to: '/announcements/new' },
      ]
    : [{ label: 'Announcements', to: '/announcements', end: true }];

  return (
    <div>
            <Tabs active={pathname} tabs={tabs} />
      <div style={{ marginTop: '1rem' }}>
        {pathname === '/announcements/new' && loggedIn ? <AddAnnouncement /> : <Announcements />}
      </div>
    </div>
  );
}