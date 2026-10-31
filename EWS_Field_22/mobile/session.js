import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
// Expo Web is a development convenience: session lives in memory only.
let memoryToken = null;
const key = "ews_session_v2";
export const session = {
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(memoryToken)
      : SecureStore.getItemAsync(key),
  set: (token) =>
    Platform.OS === "web"
      ? Promise.resolve((memoryToken = token))
      : SecureStore.setItemAsync(key, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
  clear: () =>
    Platform.OS === "web"
      ? Promise.resolve((memoryToken = null))
      : SecureStore.deleteItemAsync(key),
};
