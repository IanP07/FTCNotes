import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  useColorScheme,
} from "react-native";

interface Props {
  length?: number;
  onCodeFilled?: (code: string) => void;
}

export const VerificationCodeInput = ({ length = 6, onCodeFilled }: Props) => {
  // color scheme logic
  const colorScheme = useColorScheme();

  const lightTheme = {
    background: "#F3F3F3",
    textColor: "#000000",
  };

  const darkTheme = {
    background: "#111827",
    textColor: "#EFECD7",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    // Remove non-alphanumeric characters
    const chars = text.replace(/[^a-zA-Z0-9]/g, "").split("");
    if (chars.length === 0) return;

    const newCode = [...code];
    let i = index;

    // Fill current + following boxes
    chars.forEach((char) => {
      if (i < length) {
        newCode[i] = char.toUpperCase();
        i++;
      }
    });

    setCode(newCode);

    // Focus next empty box
    const nextIndex = newCode.findIndex((c) => c === "");
    if (nextIndex !== -1) {
      inputsRef.current[nextIndex]?.focus();
    } else {
      inputsRef.current[length - 1]?.blur(); // all filled
      onCodeFilled?.(newCode.join(""));
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      const newCode = [...code];
      if (code[index] === "" && index > 0) {
        inputsRef.current[index - 1]?.focus();
        newCode[index - 1] = "";
        setCode(newCode);
      } else {
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputs}>
        {code.map((c, i) => (
          <TextInput
            key={i}
            ref={(ref) => {
              inputsRef.current[i] = ref;
            }}
            value={c}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            style={[styles.input, { color: theme.textColor }]}
            keyboardType="default"
            maxLength={length} // allow pasting full code
            textContentType="oneTimeCode"
            textAlign="center"
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  inputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  input: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 20,
    color: "#000",
  },
});
