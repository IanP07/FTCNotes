import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";

interface DeleteConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const DeleteConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
  onClose,
}: DeleteConfirmationModalProps) => {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}></View>
      </TouchableWithoutFeedback>

      <View style={styles.modal}>
        <Text style={styles.title}>
          Are you sure you want to delete this team?
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={[styles.buttonText, { color: "black" }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onConfirm} style={styles.confirmButton}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default DeleteConfirmationModal;
