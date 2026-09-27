import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

interface EditTeamModalProps {
  name: string;
  number: number;
  onSubmit: (name: string, number: number) => Promise<void>;
  onClose: () => void;
}

export default function EditTeamModal({ name, number, onSubmit, onClose }: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(name);
  const [teamNumber, setTeamNumber] = useState(String(number));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const dark = useColorScheme() === "dark";
  const textColor = dark ? "#EFECD7" : "#242424";
  const close = () => {
    if (!submitting.current) onClose();
  };

  const submit = async () => {
    if (submitting.current) return;
    const trimmedNumber = teamNumber.trim();
    const parsedNumber = Number(trimmedNumber);
    if (!teamName.trim() || !/^\d+$/.test(trimmedNumber) || !Number.isSafeInteger(parsedNumber) || parsedNumber <= 0) {
      setError("Enter a team name and a valid positive team number.");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit(teamName.trim(), parsedNumber);
    } catch {
      setError("Could not save your changes. Please try again.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close edit team" accessibilityRole="button" />
        <View style={[styles.card, { backgroundColor: dark ? "#1F2937" : "#FFFFFF" }]} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: textColor }]}>Edit team</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>Update this team’s name and number.</Text>
            <Text style={[styles.label, { color: textColor }]}>Team name</Text>
            <TextInput
              accessibilityLabel="Team name"
              style={[styles.input, { color: textColor }]}
              value={teamName}
              onChangeText={setTeamName}
              editable={!saving}
              autoCapitalize="words"
            />
            <Text style={[styles.label, { color: textColor }]}>Team number</Text>
            <TextInput
              accessibilityLabel="Team number"
              style={[styles.input, { color: textColor }]}
              value={teamNumber}
              onChangeText={setTeamNumber}
              editable={!saving}
              keyboardType="number-pad"
              onSubmitEditing={submit}
            />
            {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={close} style={[styles.button, styles.cancel, saving && styles.disabled]}>
                <Text style={{ color: textColor, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={saving ? "Saving changes" : "Submit"} disabled={saving} onPress={submit} style={[styles.button, styles.submit, saving && styles.disabled]}>
                {saving ? <ActivityIndicator color="#242424" /> : <Text style={styles.submitText}>Submit</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  card: { width: "100%", maxWidth: 420, maxHeight: "90%", padding: 24, borderRadius: 20, elevation: 10 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#9CA3AF", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 18 },
  error: { color: "#EF4444", marginBottom: 16 },
  actions: { flexDirection: "row", gap: 12, marginTop: 6 },
  button: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  cancel: { borderWidth: 1, borderColor: "#9CA3AF" },
  submit: { backgroundColor: "rgb(250,200,0)" },
  submitText: { color: "#242424", fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
