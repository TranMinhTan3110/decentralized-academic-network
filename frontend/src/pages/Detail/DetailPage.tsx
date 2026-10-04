import { MainLayout } from '../../components/layout';
import { useAuth } from '../../lib/authStore';
import { Detail } from './Detail';

export function DetailPage() {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <Detail />
    </MainLayout>
  );
}

export { Detail };
