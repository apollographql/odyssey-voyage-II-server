const getPackageManager = () => {
  if (process.env.PACKAGE_MANAGER) {
    return process.env.PACKAGE_MANAGER;
  }

  const execPath = process.env.npm_execpath || '';
  const userAgent = process.env.npm_config_user_agent || '';

  return execPath.includes('pnpm') || userAgent.includes('pnpm')
    ? 'pnpm'
    : 'npm';
};

module.exports = { getPackageManager };
