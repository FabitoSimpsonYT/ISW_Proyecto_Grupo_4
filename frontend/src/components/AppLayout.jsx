import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const AppLayout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return children;
  }

  return (
    <div className="app-layout">
      <NotificationBell />
      {children}
    </div>
  );
};

export default AppLayout;
