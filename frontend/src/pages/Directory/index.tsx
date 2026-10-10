import { MainLayout } from '../../components/layout';
import { Directory } from './Directory';

export * from './Directory';

export function SubjectsPage() {
  return (
    <MainLayout>
      <Directory type="subject" />
    </MainLayout>
  );
}

export function SchoolsPage() {
  return (
    <MainLayout>
      <Directory type="school" />
    </MainLayout>
  );
}
