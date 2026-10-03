import { describe, it, expect } from 'vitest';
import { routesConfig, navRoutes } from '../../routes/routes.config';

describe('Routes Configuration Unit Tests', () => {
  it('contains all defined application routes', () => {
    expect(routesConfig.length).toBeGreaterThan(0);
    const paths = routesConfig.map((r) => r.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/explore');
    expect(paths).toContain('/recent');
    expect(paths).toContain('/library');
    expect(paths).toContain('/profile');
    expect(paths).toContain('/settings');
    expect(paths).toContain('/leaderboard');
    expect(paths).toContain('/quiz');
    expect(paths).toContain('/upload');
    expect(paths).toContain('/login');
  });

  it('filters navRoutes to only include routes marked with inNav !== false', () => {
    const navPaths = navRoutes.map((r) => r.path);

    expect(navPaths).toContain('/');
    expect(navPaths).toContain('/explore');
    expect(navPaths).toContain('/library');
    expect(navPaths).not.toContain('/upload');
    expect(navPaths).not.toContain('/login');
  });
});
