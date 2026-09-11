import { View } from "react-native";
import ProfileMenu from "../../components/profile-menu";

function WelcomeOnboarding() {
  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 100,
      }}
    >
      <ProfileMenu />
    </View>
  );
}

export default WelcomeOnboarding;
