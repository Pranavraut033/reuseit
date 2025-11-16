import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';

import Container from '~/components/common/Container';
import { ScreenContent } from '~/components/ScreenContent';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <ScreenContent path="app/(drawer)/index.tsx" title="Home" />
        <Link href="/login" className={styles.link}>
          <Text className={styles.linkText}>Go to home screen!</Text>
        </Link>
      </Container>
    </>
  );
}

const styles = {
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
