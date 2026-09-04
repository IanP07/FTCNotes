import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  InputAccessoryView,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";

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
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } =
    useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } =
    useSignUp();

  const lightTheme = { background: "#F3F3F3", textColor: "#000000" };
  const darkTheme = { background: "#111827", textColor: "#EFECD7" };
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const googleIcon = require("../assets/images/googleIcon.svg.png");
  const appleIcon = colorScheme === "dark" ? require("../assets/images/appleBlack.png") : require("../assets/images/appleWhite.png");

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);
  const codeAccessoryViewID = "verificationCodeAccessory";

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

  const routeAfterAuth = async (clerkUser: any) => {
    if (clerkUser) {
      const isNewUser = await syncUserWithBackend(clerkUser);
      if (isNewUser) {
        router.replace("/onboarding/welcome");
      } else {
        router.replace("/groups");
      }
    } else {
      router.replace("/groups");
    }
  };

  const onGooglePress = useCallback(async () => {
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
            await routeAfterAuth(session?.user);
          },
        });
      }
    } catch (err) {
      console.error("OAuth Error:", err);
      WebBrowser.dismissBrowser();
    }
  }, [startSSOFlow, router]);

  const onApplePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "myapp",
          path: "redirect",
        }),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            await routeAfterAuth(session?.user);
          },
        });
      }
    } catch (err) {
      console.error("Apple OAuth Error:", err);
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

  // Attempts sign-in first; if the email doesn't exist, falls back to sign-up
  const onEmailPasswordSubmit = useCallback(async () => {
    if (!signInLoaded || !signUpLoaded) return;
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      // Try signing in as an existing user first
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActiveSignIn({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            await routeAfterAuth(session?.user);
          },
        });
      } else {
        console.log("Sign-in not complete:", signInAttempt);
        setErrorMsg("Unable to sign in. Please try again.");
      }
    } catch (signInErr: any) {
      const errorCode = signInErr?.errors?.[0]?.code;

      // Email not found -> this is a new user, so create an account instead
      if (
        errorCode === "form_identifier_not_found" ||
        errorCode === "form_identifier_exists" ||
        errorCode === "form_password_incorrect_or_identifier_not_found"
      ) {
        // If the password was simply wrong for an existing account, don't
        // silently try to create a duplicate account with the same email.
        if (errorCode === "form_password_incorrect_or_identifier_not_found") {
          setErrorMsg("Incorrect email or password.");
          setSubmitting(false);
          return;
        }

        try {
          await signUp.create({
            emailAddress: email,
            password,
          });

          // Clerk requires email verification before a password account is active
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
        } catch (signUpErr: any) {
          console.error("Sign-up Error:", signUpErr);
          setErrorMsg(
            signUpErr?.errors?.[0]?.message || "Unable to create an account."
          );
        }
      } else {
        console.error("Sign-in Error:", signInErr);
        setErrorMsg(
          signInErr?.errors?.[0]?.message || "Incorrect email or password."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, password, signIn, signUp, signInLoaded, signUpLoaded]);

  const onVerifyEmail = useCallback(async () => {
    if (!signUpLoaded) return;
    if (!verificationCode) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setActiveSignUp({
          session: completeSignUp.createdSessionId,
          navigate: async ({ session }) => {
            // Brand new account, but still ask the backend for consistency
            await routeAfterAuth(session?.user);
          },
        });
      } else {
        console.log("Verification not complete:", completeSignUp);
        setErrorMsg("Invalid or expired code. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      setErrorMsg(err?.errors?.[0]?.message || "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }, [verificationCode, signUp, signUpLoaded]);

  const inputBackground = colorScheme === "dark" ? "rgb(33,40,55)" : "#efeeee";
  const inputBorder =
    colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";

  // Apple's own guidelines: the button should be pure black-on-white or
  // white-on-black, matching the system color scheme rather than the app's
  // custom theme colors.
  const appleButtonBackground = colorScheme === "dark" ? "#ffffff" : "#000000";
  const appleButtonForeground = colorScheme === "dark" ? "#000000" : "#ffffff";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      <Image
        style={styles.image}
        source={require("../assets/images/FTCNotesIcon.png")}
      />
      <Text style={[styles.text, { color: theme.textColor }]}>FTC Notes</Text>
      <Text style={[styles.subText, {color: "#888e98"}]}>Sign in to continue</Text>


      {!pendingVerification ? (
        <>
          {/* Sign in through Apple */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: appleButtonBackground,
              },
            ]}
            activeOpacity={0.3}
            onPress={onApplePress}
          >
            <Image style={{ width: 26, height: 26 }} source={appleIcon} />
            <Text style={[styles.buttonText, { color: appleButtonForeground }]}>
              Sign in with Apple
            </Text>
          </TouchableOpacity>

          {/* Sign in through google */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "rgb(248, 248, 248)",
                borderColor: inputBorder,
              },
            ]}
            activeOpacity={0.3}
            onPress={onGooglePress}
          >
            <Image style={{ width: 26, height: 26 }} source={googleIcon} />
            <Text style={[styles.buttonText, { color: theme.textColor }]}>
              Sign in with Google
            </Text>
          </TouchableOpacity>

          <View style={styles.line}></View>

          {/* Email text input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackground,
                borderColor: inputBorder,
                color: theme.textColor,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={
              colorScheme === "dark" ? "#8a8a8a" : "#999999"
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {/* Password text input */}
          <TextInput
            ref={passwordInputRef}
            style={[
              styles.input,
              {
                backgroundColor: inputBackground,
                borderColor: inputBorder,
                color: theme.textColor,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={
              colorScheme === "dark" ? "#8a8a8a" : "#999999"
            }
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              onEmailPasswordSubmit();
            }}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          
          {/* Submit through email button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: "#fbc11f",
                borderColor: inputBorder,
                justifyContent: "center",
              },
            ]}
            activeOpacity={0.3}
            onPress={onEmailPasswordSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.textColor} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.textColor }]}>
                Continue with Email
              </Text>
            )}
          </TouchableOpacity>
          
          
        </>
      ) : (
        <>
          <Text style={[styles.subText, { color: theme.textColor }]}>
            We sent a verification code to {email}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackground,
                borderColor: inputBorder,
                color: theme.textColor,
              },
            ]}
            placeholder="Verification code"
            placeholderTextColor={
              colorScheme === "dark" ? "#8a8a8a" : "#999999"
            }
            keyboardType="number-pad"
            value={verificationCode}
            onChangeText={setVerificationCode}
            returnKeyType="done"
            ref={codeInputRef}
            inputAccessoryViewID={
              Platform.OS === "ios" ? codeAccessoryViewID : undefined
            }
            onSubmitEditing={() => {
              Keyboard.dismiss();
              onVerifyEmail();
            }}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "#e9e9e9ff",
                borderColor: inputBorder,
                justifyContent: "center",
              },
            ]}
            activeOpacity={0.3}
            onPress={onVerifyEmail}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.textColor} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.textColor }]}>
                Verify Email
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
      </ScrollView>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={codeAccessoryViewID}>
          <View
            style={[
              styles.accessoryBar,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1f2733" : "#f6f6f6",
                borderTopColor: inputBorder,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onVerifyEmail();
              }}
            >
              <Text style={styles.accessoryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </KeyboardAvoidingView>
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
    width: "27%",
    height: "12.5%",
    justifyContent: "center",
  },
  text: {
    color: "black",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  subText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
    width: 270,
  },
  buttonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  appleLogo: {
    fontSize: 22,
    lineHeight: 26,
    // NOTE: this is a Unicode Apple glyph used as a placeholder icon. Swap
    // this <Text> for an <Image source={require(...)} /> once a real Apple
    // logo asset (per Apple's Human Interface Guidelines) is added to
    // assets/images/.
  },
  button: {
    paddingHorizontal: 33,
    width: 270,
    borderRadius: 10,
    minHeight: 50,
    margin: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderStyle: "solid",
    borderWidth: 1,
  },
  input: {
    width: 270,
    borderRadius: 10,
    borderWidth: 0.3,
    borderStyle: "solid",
    paddingVertical: 12,
    paddingHorizontal: 14,
    margin: 6,
    fontSize: 16,
  },
  line: {
    width: "69%",
    marginVertical: 20,
    height: 2,
    backgroundColor: "#c0c0c0",
    borderRadius: 999,
  },
  errorText: {
    color: "#e05252",
    fontSize: 13,
    textAlign: "center",
    width: 270,
    marginTop: 2,
    marginBottom: 2,
  },
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  accessoryButtonText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },
});