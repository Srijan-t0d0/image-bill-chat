import * as ImagePicker from 'expo-image-picker';

export interface ImageResult {
  uri: string;
  base64: string;
}

export async function pickImageFromCamera(): Promise<ImageResult | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      'Camera permission is required. Please enable it in your device settings.',
    );
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) {
    throw new Error('Failed to encode image. Please try again.');
  }

  return { uri: asset.uri, base64: asset.base64 };
}

export async function pickImageFromGallery(): Promise<ImageResult | null> {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      'Gallery permission is required. Please enable it in your device settings.',
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) {
    throw new Error('Failed to encode image. Please try again.');
  }

  return { uri: asset.uri, base64: asset.base64 };
}
