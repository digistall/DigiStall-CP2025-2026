import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import DocumentModal from "../Documents/Components/DocumentModal/DocumentModal";

const { width, height } = Dimensions.get("window");

const DocumentsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [submittedDocuments, setSubmittedDocuments] = useState(null);

  const handleDocumentSubmit = (documents) => {
    setSubmittedDocuments(documents);
    Alert.alert(
      "Documents Submitted",
      "Your documents have been submitted successfully and are under review.",
      [{ text: "OK" }]
    );
  };

  const getSubmittedDocumentsCount = () => {
    if (!submittedDocuments) return 0;
    return Object.values(submittedDocuments).filter((doc) => doc !== null)
      .length;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Kindly upload the required documents for your stall application. Having
          a record of your documents in the system is essential.
        </Text>

        <View style={styles.requirementsCard}>
          <Text style={styles.cardTitle}>Required Documents:</Text>
          <View style={styles.requirementsList}>
            <Text style={styles.requirementItem}>1. Voter's ID</Text>
            <Text style={styles.requirementItem}>2. Association Clearance</Text>
            <Text style={styles.requirementItem}>
              3. Barangay Business Clearance
            </Text>
            <Text style={styles.requirementItem}>
              4. Picture with White Background
            </Text>
            <Text style={styles.requirementItem}>5. Health Card</Text>
            <Text style={styles.requirementItem}>6. Cedula</Text>
          </View>
        </View>

        {submittedDocuments && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Submission Status</Text>
            <Text style={styles.statusText}>
              {getSubmittedDocumentsCount()} of 6 documents submitted
            </Text>
            <Text style={styles.statusSubtext}>
              Your documents are under review
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.uploadButtonText}>
            {submittedDocuments ? "Update Documents" : "Upload Documents"}
          </Text>
        </TouchableOpacity>

        <DocumentModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleDocumentSubmit}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.03,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: height * 0.02,
    lineHeight: width * 0.058,
  },
  requirementsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: height * 0.015,
  },
  requirementsList: {
    paddingLeft: width * 0.02,
  },
  requirementItem: {
    fontSize: width * 0.038,
    color: "#374151",
    marginBottom: height * 0.008,
    lineHeight: width * 0.05,
  },
  statusCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  statusTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: height * 0.005,
  },
  statusText: {
    fontSize: width * 0.04,
    color: "#047857",
    fontWeight: "500",
    marginBottom: height * 0.005,
  },
  statusSubtext: {
    fontSize: width * 0.035,
    color: "#059669",
  },
  uploadButton: {
    backgroundColor: "#305CDE",
    borderRadius: 10,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.06,
    alignItems: "center",
    marginTop: height * 0.02,
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  uploadButtonText: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default DocumentsScreen;
