export type ShellRouteName =
  | 'overview'
  | 'apply'
  | 'applications'
  | 'application-detail'
  | 'review'
  | 'audit'
  | 'account';

export interface ShellRoute {
  name: ShellRouteName;
  dprId?: string;
}

export function parseHash(rawHash: string): ShellRoute {
  const hash = rawHash || '';
  const lower = hash.toLowerCase();
  if (lower === '' || lower === '#home' || lower === '#/' || lower === '#/overview') return { name: 'overview' };
  if (lower === '#feasibility' || lower === '#feasibility-check' || lower === '#/apply') return { name: 'apply' };
  if (lower === '#/applications') return { name: 'applications' };
  if (lower === '#/review') return { name: 'review' };
  if (lower === '#/audit') return { name: 'audit' };
  if (lower === '#/account') return { name: 'account' };
  const detail = /^#\/applications\/([^/]+)$/.exec(hash);
  if (detail && detail[1]) return { name: 'application-detail', dprId: detail[1] };
  return { name: 'overview' };
}

export function routeHash(route: ShellRoute): string {
  if (route.name === 'application-detail' && route.dprId) return `#/applications/${route.dprId}`;
  return `#/${route.name}`;
}

export function navigateTo(route: ShellRoute): void {
  const target = routeHash(route);
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'dic_officer' || role === 'sca_auditor';
}
