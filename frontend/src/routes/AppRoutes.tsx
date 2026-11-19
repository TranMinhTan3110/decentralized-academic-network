import { Routes, Route } from 'react-router-dom';
import { routesConfig } from './routes.config';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      {routesConfig.map(({ path, element, public: isPublic, allowedRoles }) => {
        const needsProtection = isPublic === false || (allowedRoles && allowedRoles.length > 0);
        const routeElement = needsProtection ? (
          <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
        ) : (
          element
        );
        return <Route key={path} path={path} element={routeElement} />;
      })}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
