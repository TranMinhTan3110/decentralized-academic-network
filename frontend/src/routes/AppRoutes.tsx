import { Routes, Route } from 'react-router-dom';
import { routesConfig } from './routes.config';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      {routesConfig.map(({ path, element, public: isPublic }) => {
        const routeElement = isPublic === false ? <ProtectedRoute>{element}</ProtectedRoute> : element;
        return <Route key={path} path={path} element={routeElement} />;
      })}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
