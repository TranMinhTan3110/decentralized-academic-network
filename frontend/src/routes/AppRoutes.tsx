import { Routes, Route } from 'react-router-dom';
import { routesConfig } from './routes.config';
import { HomePage } from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      {routesConfig.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
