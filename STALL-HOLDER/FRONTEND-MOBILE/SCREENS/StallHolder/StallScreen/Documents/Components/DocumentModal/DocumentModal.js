import { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import UploadDocuments from "../UploadDocument/UploadDocuments";
import { styles } from "../DocumentModal/DocumentModalStyles";

const DocumentModal = ({ visible, onClose, onSubmit }) => {
  const [documents, setDocuments] = useState({
    votersId: null,
    associationClearance: null,
    barangayBusinessClearance: null,
    pictureWhiteBackground: null,
    healthCard: null,
    cedula: null,
  });

  const documentTypes = [
    {
      key: "votersId",
      title: "Voter's ID",
      description: "Upload a clear photo of your Voter's ID",
    },
    {
      key: "associationClearance",
      title: "Association Clearance",
      description: "Upload your Association Clearance document",
    },
    {
      key: "barangayBusinessClearance",
      title: "Barangay Business Clearance",
      description: "Upload your Barangay Business Clearance",
    },
    {
      key: "pictureWhiteBackground",
      title: "Picture with White Background",
      description: "Upload a 2x2 photo with white background",
    },
    {
      key: "healthCard",
      title: "Health Card",
      description: "Upload your valid Health Card",
    },
    {
      key: "cedula",
      title: "Cedula",
      description: "Upload your Cedula document",
    },
  ];

  const handleDocumentChange = (documentKey, document) => {
    setDocuments((prev) => ({
      ...prev,
      [documentKey]: document,
    }));
  };

  // Calculate progress
  const getProgress = () => {
    const uploadedCount = Object.values(documents).filter(
      (doc) => doc !== null
    ).length;
    return {
      uploaded: uploadedCount,
      total: documentTypes.length,
      percentage: (uploadedCount / documentTypes.length) * 100,
    };
  };

  const handleSubmit = () => {
    const uploadedDocuments = Object.values(documents).filter(
      (doc) => doc !== null
    );

    if (uploadedDocuments.length === 0) {
      Alert.alert(
        "No Documents",
        "Please upload at least one document before submitting."
      );
      return;
    }

    if (uploadedDocuments.length < documentTypes.length) {
      Alert.alert(
        "Incomplete Documents",
        `You have uploaded ${uploadedDocuments.length} out of ${documentTypes.length} required documents. Do you want to submit anyway?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Submit Anyway",
            onPress: () => {
              onSubmit(documents);
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onSubmit(documents);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setDocuments({
      votersId: null,
      associationClearance: null,
      barangayBusinessClearance: null,
      pictureWhiteBackground: null,
      healthCard: null,
      cedula: null,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const progress = getProgress();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {/* Header */}
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {progress.uploaded} of {progress.total} documents uploaded
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.percentage}%` },
              ]}
            />
          </View>
        </View>

        {/* Document Upload Section */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Please upload the image of the required documents, make sure that
            the documents are clear and complete.
          </Text>

          {documentTypes.map((docType) => (
            <UploadDocuments
              key={docType.key}
              documentType={docType}
              uploadedDocument={documents[docType.key]}
              onDocumentChange={handleDocumentChange}
            />
          ))}

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit Documents</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default DocumentModal;
