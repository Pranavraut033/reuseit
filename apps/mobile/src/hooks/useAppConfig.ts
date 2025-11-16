import resolveConfig from 'tailwindcss/resolveConfig';

import AppConfig from '@/app.config';
import tailwindConfig from '@/tailwind.config';

const resolvedTailwindConfig = resolveConfig(tailwindConfig);

function useAppConfig() {
  return {
    ...AppConfig,
    tailwindConfig: resolvedTailwindConfig,
    primaryColor: (resolvedTailwindConfig.theme.colors as any).primary.DEFAULT || '#34A853',
  };
}

export default useAppConfig;
