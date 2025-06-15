import { SafeAreaView, View } from 'react-native';

export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaView className={styles.container}>
      {children}
      <View className="h-[80px]" />
    </SafeAreaView>
  );
};

const styles = {
  container: 'flex flex-1 p-6',
};
