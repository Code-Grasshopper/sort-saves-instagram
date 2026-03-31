import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { SQLiteDatabase } from "expo-sqlite";

import { exportDatabase, importDatabase } from "@/db/repository";
import type { BackupPayload } from "@/types/models";

export async function exportBackupToFile(db: SQLiteDatabase) {
  const payload = await exportDatabase(db);
  const fileUri = `${FileSystem.documentDirectory}instasort-backup-${Date.now()}.json`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: "Экспорт базы InstaSort",
      mimeType: "application/json"
    });
  }

  return fileUri;
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as BackupPayload;
  return payload.version === 1 && Array.isArray(payload.categories) && Array.isArray(payload.posts);
}

export async function importBackupFromFile(db: SQLiteDatabase) {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false
  });

  if (result.canceled || !result.assets[0]) {
    return false;
  }

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8
  });
  const payload = JSON.parse(content);

  if (!isBackupPayload(payload)) {
    throw new Error("Выбранный файл не похож на backup InstaSort.");
  }

  await importDatabase(db, payload);
  return true;
}
