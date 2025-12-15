import { Text } from 'react-native';

import { t, type TranslationKey } from '~/utils/i18n';

interface Props extends React.ComponentProps<typeof Text> {
  key: TranslationKey;
  children?: never | undefined;
}

const Translation: React.FC<Props> = ({ key, ...props }) => {
  return <Text {...props}>{t(key)}</Text>;
};

export default Translation;
