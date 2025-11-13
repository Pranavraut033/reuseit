import AppConfig, { primaryColor } from '~/app.config';
import tailwindConfig from '~/tailwind.config';
import resolveConfig from 'tailwindcss/resolveConfig';

const resolvedTailwindConfig = resolveConfig(tailwindConfig);

function useAppConfig() {
  return {
    ...AppConfig,
    tailwindConfig: resolvedTailwindConfig,
    primaryColor:  primaryColor || "#34A853",
  };
}

export default useAppConfig;