import { View } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import ProfileMenu from "../components/profile-menu";

function Test() {
  const { userId, isSignedIn } = useAuth();
  const { user } = useUser();

  console.log("User email: ", user?.primaryEmailAddress?.emailAddress);
  console.log("User ID: ", userId);
  console.log("Is user signed in: ", isSignedIn);

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

export default Test;
