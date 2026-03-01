import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../UploadDocument/UploadDocumentStyles";

const UploadDocuments = ({
  documentType,
  uploadedDocument,
  onDocumentChange,
}) => {
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images"
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert("Select Image", "Choose how you want to upload the document", [
      {
        text: "Camera",
        onPress: () => openCamera(),
      },
      {
        text: "Gallery",
        onPress: () => openGallery(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      onDocumentChange(documentType.key, result.assets[0]);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      onDocumentChange(documentType.key, result.assets[0]);
    }
  };

  const removeImage = () => {
    Alert.alert(
      "Remove Document",
      "Are you sure you want to remove this document?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            onDocumentChange(documentType.key, null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.documentCard}>
      <Text style={styles.documentTitle}>{documentType.title}</Text>
      <Text style={styles.documentDescription}>{documentType.description}</Text>

      {uploadedDocument ? (
        <View style={styles.uploadedImageContainer}>
          <Image
            source={{ uri: uploadedDocument.uri }}
            style={styles.uploadedImage}
          />
          <View style={styles.imageActions}>
            <TouchableOpacity onPress={pickImage} style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
          <Text style={styles.uploadIcon}>📁</Text>
          <Text style={styles.uploadButtonText}>
            Upload {documentType.title}
          </Text>
          <Text style={styles.uploadHint}>
            Tap to select from camera or gallery
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UploadDocuments;
