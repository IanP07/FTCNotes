import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { ScoutEvent, ScoutTeam } from "../../services/ftcScout";

type Props = {
  visible: boolean;
  events: ScoutEvent[];
  preview: { event: ScoutEvent; teams: ScoutTeam[] } | null;
  busy: boolean;
  error: string;
  onSelect: (event: ScoutEvent) => void;
  onManual: () => void;
  onClose: () => void;
  onBack: () => void;
};

export default function ScoutEventModal(props: Props) {
  const dark = useColorScheme() === "dark";
  const text = { color: dark ? "#EFECD7" : "#000000" };
  const muted = { color: dark ? "#CBD5E1" : "#626262" };
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={() => !props.busy && props.onClose()}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={[styles.modal, { backgroundColor: dark ? "#111827" : "#F3F3F3" }]}>
          <Text accessibilityRole="header" style={[styles.title, text]}>
            {props.preview ? "Team preview" : "Find your event"}
          </Text>
          <Text style={[styles.description, muted]}>
            {props.preview
              ? `${props.preview.event.name} · ${props.preview.teams.length} teams. Preview only; nothing has been saved.`
              : "Select a FTCScout event to preview its teams, or enter teams manually."}
          </Text>
          {!!props.error && <Text accessibilityRole="alert" style={[styles.description, { color: dark ? "#FCA5A5" : "#B91C1C" }]}>{props.error}</Text>}
          {props.busy && <View style={styles.loading}><ActivityIndicator color="#cfa323" /><Text style={text}>Loading…</Text></View>}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {props.preview ? (
              props.preview.teams.length ? props.preview.teams.map((team) => (
                <View key={team.number} style={[styles.row, { borderColor: dark ? "#374151" : "#ccc" }]}>
                  <Text style={[styles.rowTitle, text]}>{team.number} · {team.name}</Text>
                </View>
              )) : <Text style={[styles.description, text]}>No teams are listed for this event yet. You can enter teams manually.</Text>
            ) : props.events.map((event) => (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preview teams for ${event.name}`} disabled={props.busy} key={`${event.season}-${event.code}`} onPress={() => props.onSelect(event)} style={[styles.row, { backgroundColor: dark ? "#1F2937" : "#fff", borderColor: dark ? "#374151" : "#ccc" }, props.busy && styles.disabled]}>
                <Text style={[styles.rowTitle, text]}>{event.name}</Text>
                <Text style={muted}>{event.start} · {event.code}</Text>
                <Text style={muted}>{[event.city, event.state, event.country].filter(Boolean).join(", ")}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity accessibilityRole="button" disabled={props.busy} onPress={props.onManual} style={[styles.primary, props.busy && styles.disabled]}>
            <Text style={styles.primaryText}>Enter teams manually</Text>
          </TouchableOpacity>
          {props.preview && <TouchableOpacity accessibilityRole="button" disabled={props.busy} onPress={props.onBack} style={styles.secondary}><Text style={text}>Back to results</Text></TouchableOpacity>}
          <TouchableOpacity accessibilityRole="button" disabled={props.busy} onPress={props.onClose} style={styles.secondary}><Text style={text}>Back to event details</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modal: { width: "100%", maxWidth: 520, maxHeight: "85%", padding: 20, borderRadius: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 21, marginBottom: 14 },
  list: { flexGrow: 0, flexShrink: 1 },
  listContent: { gap: 10, paddingBottom: 12 },
  row: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 5 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  loading: { flexDirection: "row", gap: 10, paddingBottom: 14 },
  primary: { backgroundColor: "rgb(250,200,0)", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  primaryText: { color: "#000", fontWeight: "600", fontSize: 16 },
  secondary: { padding: 14, alignItems: "center" },
  disabled: { opacity: 0.5 },
});
