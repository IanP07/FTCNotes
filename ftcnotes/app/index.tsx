import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO, useUser } from "@clerk/clerk-expo";

if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const HomeScreen = () => {
  useWarmUpBrowser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { startSSOFlow } = useSSO();
  const { isLoaded, isSignedIn } = useUser();

  const lightTheme = { background: "#F3F3F3", textColor: "#000000" };
  const darkTheme = { background: "#111827", textColor: "#EFECD7" };
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const googleIcon = require("../assets/images/googleIcon.svg.png");

  // Helper function to create user and get is_new_user field
  const syncUserWithBackend = async (clerkUser: any) => {
    try {
      const res = await fetch("https://inp.pythonanywhere.com/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clerkUser.fullName,
          user_id: clerkUser.id,
          email:
            clerkUser.primaryEmailAddress?.emailAddress ||
            clerkUser.emailAddresses[0]?.emailAddress,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.is_new_user;
      } else {
        console.log("Failed to sync user with backend:", await res.text());
        return false;
      }
    } catch (error) {
      console.log("Backend synchronization error: ", error);
      return false;
    }
  };

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "myapp",
          path: "redirect",
        }),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            const clerkUser = session?.user;

            if (clerkUser) {
              // Send data to backend and get sign-up vs sign-in distinction
              const isNewUser = await syncUserWithBackend(clerkUser);

              if (isNewUser) {
                router.replace("/onboarding/welcome"); // New user screen
              } else {
                router.replace("/groups"); // Existing user screen
              }
            } else {
              // if it doesnt load user quick enough
              router.replace("/groups");
            }
          },
        });
      }
    } catch (err) {
      console.error("OAuth Error:", err);
      WebBrowser.dismissBrowser();
    }
  }, [startSSOFlow, router]);

  // if they open the app already logged in
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace("/groups");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.textColor }]}>FTC Notes</Text>
      <Image
        style={styles.image}
        source={require("../assets/images/FTCNotesIcon.png")}
      />

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              colorScheme === "dark" ? "rgb(33,40,55)" : "#e9e9e9ff",
            borderColor:
              colorScheme === "dark"
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
          },
        ]}
        activeOpacity={0.3}
        onPress={onPress} // Reverted back to onboarding authentication flow
      >
        <Image style={{ width: 40, height: 40 }} source={googleIcon} />
        <Text style={[styles.buttonText, { color: theme.textColor }]}>
          Sign in with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "54%",
    height: "25%",
    justifyContent: "center",
  },
  text: {
    color: "black",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: 270,
    borderRadius: 10,
    minHeight: 40,
    margin: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderStyle: "solid",
    borderWidth: 1,
  },
});