import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomAlert } from "../../../components/Common/CustomAlert";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

// Import services
import ApiService from "../../../services/ApiService";
import UserStorageService from "../../../services/UserStorageService";
import DocumentUploadHelper from "../../../services/DocumentUploadHelper";
import PickerActiveFlag from "../../../services/PickerActiveFlag";
import { useTheme } from "../../../components/ThemeComponents/ThemeContext";
import CrudLoadingOverlay from "../../../components/Common/CrudLoadingOverlay";
import useLoading from "../../../hooks/useLoading";

const { width } = Dimensions.get("window");

const VendorDocumentsScreen = () => {
  const { theme, isDark } = useTheme();
  const { startLoading, stopLoading, overlayProps } = useLoading();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);

  // Preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const vendorId = userData?.vendor?.vendor_id;
    if (vendorId) {
      loadVendorDocuments();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const userToken = await UserStorageService.getAuthToken();
      const storedUserData = await UserStorageService.getUserData();

      if (storedUserData) {
        setToken(userToken);
        setUserData(storedUserData);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  };

  const loadVendorDocuments = async () => {
    try {
      setLoading(true);

      const vendorId = userData?.vendor?.vendor_id;
      if (!vendorId) {
        console.log("❌ No vendor ID found");
        setLoading(false);
        return;
      }

      console.log("📄 Loading vendor document requirements for vendor:", vendorId);

      const response = await ApiService.getVendorDocumentRequirements(vendorId);

      if (response.success && response.data) {
        setRequirements(response.data.requirements || []);
        console.log(`✅ Loaded ${response.data.requirements?.length || 0} document requirements`);
      } else {
        showAlert("error", "Error", response.message || "Failed to load documents");
      }
    } catch (error) {
      console.error("Error loading vendor documents:", error);
      showAlert("error", "Error", "Failed to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVendorDocuments();
  }, [userData]);

  const getUploadedCount = () => {
    return requirements.filter((doc) => doc.status !== "not_uploaded").length;
  };

  const getRequiredCount = () => {
    return requirements.filter((doc) => doc.is_required).length;
  };

  // =============================================
  // UPLOAD HANDLERS
  // =============================================

  const handleUpload = (documentTypeId, documentName) => {
    showAlert("info", "Upload Document", `Select upload method for ${documentName}`, [
      {
        text: "Take Photo",
        onPress: () => uploadFromCamera(documentTypeId),
      },
      {
        text: "Choose from Gallery",
        onPress: () => uploadFromGallery(documentTypeId),
      },
      {
        text: "Choose Document/PDF",
        onPress: () => uploadDocument(documentTypeId),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const uploadFromCamera = async (documentTypeId) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        showAlert("warning", "Permission Required", "Camera permission is required to take photos");
        return;
      }

      PickerActiveFlag.set(true);
      let result;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });
      } finally {
        PickerActiveFlag.set(false);
      }

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId);
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to capture image");
      console.error("Camera error:", error);
    }
  };

  const uploadFromGallery = async (documentTypeId) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showAlert("warning", "Permission Required", "Gallery permission is required");
        return;
      }

      PickerActiveFlag.set(true);
      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });
      } finally {
        PickerActiveFlag.set(false);
      }

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId);
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to select image");
      console.error("Gallery error:", error);
    }
  };

  const uploadDocument = async (documentTypeId) => {
    try {
      PickerActiveFlag.set(true);
      let result;
      try {
        result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });
      } finally {
        PickerActiveFlag.set(false);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await performUpload(result.assets[0], documentTypeId);
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to select document");
      console.error("Document picker error:", error);
    }
  };

  const performUpload = async (file, documentTypeId) => {
    try {
      setUploading(true);
      startLoading("upload", "Document");

      const vendorId = userData?.vendor?.vendor_id;
      let currentToken = token;
      if (!currentToken) {
        currentToken = await UserStorageService.getAuthToken();
      }

      // Prepare upload payload (reuse DocumentUploadHelper pattern)
      const uri = file.uri || file.path;
      const fileName = file.name || file.fileName || `document_${Date.now()}.jpg`;
      let mimeType = file.mimeType || file.type;

      // Fix incomplete MIME types
      if (!mimeType || mimeType === "image" || !mimeType.includes("/")) {
        mimeType = DocumentUploadHelper.getMimeType(fileName);
      }

      const validMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "application/pdf"];
      if (!validMimeTypes.includes(mimeType)) {
        const derived = DocumentUploadHelper.getMimeType(fileName);
        mimeType = validMimeTypes.includes(derived) ? derived : "image/jpeg";
      }

      const fileSize = file.fileSize || file.size || (await DocumentUploadHelper.getFileSize(uri));

      if (!DocumentUploadHelper.validateFileSize(fileSize)) {
        throw new Error(
          `File size exceeds 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB). Please choose a smaller file.`
        );
      }

      const uploadPayload = {
        vendor_id: vendorId,
        document_type_id: documentTypeId,
        uri,
        mime_type: mimeType,
        file_name: fileName,
        file_size: fileSize,
      };

      console.log("📤 Uploading vendor document:", { vendorId, documentTypeId, fileName });

      const response = await ApiService.uploadVendorDocumentBlob(uploadPayload, currentToken);

      if (response.success) {
        showAlert("success", "Success", "Document uploaded successfully and is pending verification");
        await loadVendorDocuments();
      } else {
        showAlert("error", "Upload Failed", response.message || "Failed to upload");
      }
    } catch (error) {
      showAlert("error", "Error", error.message || "Failed to upload document");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      stopLoading();
    }
  };

  // =============================================
  // PREVIEW HANDLER
  // =============================================

  const handlePreview = async (document) => {
    if (!document.document_id) return;

    try {
      setPreviewVisible(true);
      setPreviewLoading(true);

      const response = await ApiService.getVendorDocumentBlobBase64(document.document_id);

      if (response.success) {
        setPreviewData({
          uri: response.data,
          mimeType: response.mimeType,
          fileName: response.fileName,
          status: document.status,
        });
      } else {
        showAlert("error", "Error", "Failed to load document preview");
        setPreviewVisible(false);
      }
    } catch (error) {
      console.error("Preview error:", error);
      showAlert("error", "Error", "Failed to load document preview");
      setPreviewVisible(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      case "expired":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
      case "approved":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "rejected":
        return "close-circle";
      case "expired":
        return "alert-circle";
      default:
        return "ellipse-outline";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
      case "approved":
        return "Verified";
      case "pending":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      case "expired":
        return "Expired";
      default:
        return "Not Uploaded";
    }
  };

  const isDocumentApproved = (status) => {
    const s = status?.toLowerCase();
    return s === "verified" || s === "approved";
  };

  // =============================================
  // RENDER
  // =============================================

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading documents...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1d4ed8"]}
            tintColor="#1d4ed8"
          />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: "#1d4ed8" }]}>
                {getUploadedCount()}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Uploaded
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: "#f59e0b" }]}>
                {getRequiredCount()}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Required
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: "#10b981" }]}>
                {requirements.filter((d) => isDocumentApproved(d.status)).length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Verified
              </Text>
            </View>
          </View>
        </View>

        {/* Document List */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Required Documents
          </Text>

          {requirements.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No document requirements found
              </Text>
            </View>
          ) : (
            requirements.map((doc, index) => (
              <View
                key={`${doc.document_type_id}-${index}`}
                style={[styles.documentCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentInfo}>
                    <View style={styles.documentTitleRow}>
                      <Ionicons
                        name="document-text"
                        size={20}
                        color="#1d4ed8"
                        style={styles.docIcon}
                      />
                      <Text style={[styles.documentName, { color: theme.colors.text }]}>
                        {doc.document_name}
                      </Text>
                      {doc.is_required ? (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      ) : null}
                    </View>
                    {doc.description ? (
                      <Text
                        style={[styles.documentDescription, { color: theme.colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {doc.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Status & Actions */}
                <View style={styles.documentFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) + "20" }]}>
                    <Ionicons
                      name={getStatusIcon(doc.status)}
                      size={14}
                      color={getStatusColor(doc.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                      {getStatusLabel(doc.status)}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    {/* View button if document is uploaded */}
                    {doc.status !== "not_uploaded" && doc.document_id && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.viewBtn]}
                        onPress={() => handlePreview(doc)}
                      >
                        <Ionicons name="eye-outline" size={16} color="#1d4ed8" />
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity>
                    )}

                    {/* Upload/Re-upload button (not for verified docs) */}
                    {!isDocumentApproved(doc.status) && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.uploadBtn]}
                        onPress={() => handleUpload(doc.document_type_id, doc.document_name)}
                        disabled={uploading}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                        <Text style={styles.uploadBtnText}>
                          {doc.status === "not_uploaded" ? "Upload" : "Re-upload"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Rejection reason */}
                {doc.status === "rejected" && doc.rejection_reason && (
                  <View style={styles.rejectionContainer}>
                    <Ionicons name="information-circle" size={14} color="#ef4444" />
                    <Text style={styles.rejectionText}>
                      Reason: {doc.rejection_reason}
                    </Text>
                  </View>
                )}

                {/* Upload date */}
                {doc.upload_date && (
                  <Text style={[styles.uploadDate, { color: theme.colors.textSecondary }]}>
                    Uploaded: {new Date(doc.upload_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: "#eff6ff" }]}>
          <Ionicons name="information-circle" size={20} color="#1d4ed8" />
          <Text style={styles.instructionsText}>
            Upload clear, readable copies of your documents. Accepted formats: JPG, PNG, PDF (max 5MB).
            Documents are reviewed by the branch manager.
          </Text>
        </View>
      </ScrollView>

      {/* Document Preview Modal */}
      {previewVisible && (
        <View style={styles.previewOverlay}>
          <View style={[styles.previewContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                {previewData?.fileName || "Document Preview"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPreviewVisible(false);
                  setPreviewData(null);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.previewBody}>
              {previewLoading ? (
                <ActivityIndicator size="large" color="#1d4ed8" />
              ) : previewData?.uri ? (
                <Image
                  source={{ uri: previewData.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: theme.colors.textSecondary }}>
                  Unable to load preview
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      <CrudLoadingOverlay {...overlayProps} />

      {/* Alert Component */}
      <AlertComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },

  // Section
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  // Empty State
  emptyCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Document Card
  documentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  docIcon: {
    marginRight: 8,
  },
  documentName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
  },
  documentDescription: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 28,
  },

  // Footer
  documentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewBtn: {
    backgroundColor: "#eff6ff",
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  uploadBtn: {
    backgroundColor: "#1d4ed8",
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  // Rejection
  rejectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#fee2e2",
    gap: 6,
  },
  rejectionText: {
    fontSize: 12,
    color: "#ef4444",
    flex: 1,
  },

  // Upload date
  uploadDate: {
    fontSize: 11,
    marginTop: 8,
    marginLeft: 28,
  },

  // Instructions
  instructionsCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    alignItems: "flex-start",
  },
  instructionsText: {
    fontSize: 12,
    color: "#1e40af",
    flex: 1,
    lineHeight: 18,
  },

  // Preview Modal
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  previewContainer: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  previewBody: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  previewImage: {
    width: "100%",
    height: 400,
  },
});

export default VendorDocumentsScreen;
