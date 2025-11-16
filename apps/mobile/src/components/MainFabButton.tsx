import { FontAwesome6 as Icon } from '@expo/vector-icons';
import clsx from "clsx";
import { Href, usePathname, useRouter } from "expo-router";
import { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FabButton } from "./common/FabButton";

type FabOptionType = {
  title: string;
  accessibilityLabel: string;
  iconName: keyof typeof Icon.glyphMap;
  route: Href;
  routes?: Href[];
}
const CameraOptions: FabOptionType = {
  title: 'Scan Item',
  accessibilityLabel: 'Scan item to identify recyclable materials',
    iconName: 'camera',
  route: '/identify',
}

const CreatePostOptions: FabOptionType = {
  title: 'Create Post',
  accessibilityLabel: 'Create a new post',
  iconName: 'plus',
  route: '/posts/create',
  routes: ['/posts']
}

const MainFabButton = memo(function MainFabButton() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const pathname = usePathname() as Href;

  const isOnCreatePostRoute = CreatePostOptions.routes?.includes(pathname);
  const props = isOnCreatePostRoute ? CreatePostOptions : CameraOptions;

  return (
    <FabButton
      className={clsx(
        'absolute bottom-4 right-4 z-[30] shadow shadow-primary'
      )}
      size="regular"
      style={{
        bottom: bottom + 17,
        elevation: 3,
        shadowColor: 'black',
      }}
      icon={({ size, color }) => <Icon name={props.iconName} size={size} color={color} />}
      onPress={() => router.navigate(props.route)}
    />
  );
});
export default MainFabButton;
