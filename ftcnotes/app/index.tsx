import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
} from "react-native";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const HomeScreen = () => {
  useWarmUpBrowser();

  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  // Sends create user request to backend
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const createUser = async () => {
      try {
        const res = await fetch(
          "https://inp.pythonanywhere.com/api/create-user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: user.fullName,
              user_id: user.id,
              email:
                user.primaryEmailAddress?.emailAddress ||
                user.emailAddresses[0]?.emailAddress,
            }),
          }
        );

        if (!res.ok) {
          console.log("Failed to create user:", await res.text());
        } else {
          console.log("User successfully created!");
        }
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    createUser();
  }, [isLoaded, isSignedIn, user]);

  const switchPage = () => {
    router.push("/admindashboard");
  };

  const colorScheme = useColorScheme();

  const lightTheme = {
    background: "#F3F3F3",
    textColor: "#000000",
  };

  const darkTheme = {
    background: "#111827",
    textColor: "#EFECD7",
  };

  const googleIcon = require("../assets/images/googleIcon.svg.png");

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const { startSSOFlow } = useSSO();

  // Redirects users that are already signed in
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/groups");
    }
  }, [isLoaded, isSignedIn, router]);

  const onPress = useCallback(async () => {
    console.log(
      AuthSession.makeRedirectUri({
        scheme: "myapp",
      })
    );
    try {
      console.log("message1");
      console.log("message2");
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          // For wb, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
          redirectUrl: AuthSession.makeRedirectUri({
            scheme: "myapp",
            path: "redirect",
          }),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          // Check for session tasks and navigate to custom UI to help users resolve them
          // See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              router.push("/groups");
              return;
            }
            router.push("/groups");
          },
        });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error("OAuth Error:", err);
      console.error(JSON.stringify(err, null, 2));
      WebBrowser.dismissBrowser();
    }
  }, [startSSOFlow, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.textColor }]}>FTC Notes</Text>
      <Image
        style={styles.image}
        source={require("../assets/images/screaming-eagles.png")}
      />

      <TouchableOpacity // button class with more functionality
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
          ,
        ]}
        activeOpacity={0.3}
        onPress={switchPage}
      >
        <Image style={{ width: 40, height: 40 }} source={googleIcon}></Image>
        <Text style={[styles.buttonText, { color: theme.textColor }]}>
          Signin with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1, // Makes <View></View> tag fill screen
    flexDirection: "column",
    justifyContent: "center", // centers all content within this
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
    fontWeight: "semibold",
    textAlign: "center",
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: 270,
    borderRadius: 10,
    minHeight: 40,
    margin: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgb(33,40,55)",
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
});
