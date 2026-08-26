import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UpdateInfo } from '../services/updateChecker';
import { downloadAndInstallApk } from '../services/apkInstaller';
import { Paleta } from '../theme/colors';

interface Props {
  update: UpdateInfo;
  paleta: Paleta;
  onDismiss: () => void;
}

export function UpdateDialog({ update, paleta: p, onDismiss }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setDownloading(true);
    setError(null);
    try {
      await downloadAndInstallApk(update.downloadUrlApk);
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo instalar la actualización');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: p.card }]}>
          <Text style={[styles.title, { color: p.text }]}>Actualización disponible</Text>
          <Text style={[styles.body, { color: p.textMuted }]}>
            Hay una nueva versión disponible (v{update.latestVersion}).
          </Text>
          {error ? <Text style={[styles.error, { color: p.retiro }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onDismiss} disabled={downloading} style={styles.ghostButton}>
              <Text style={[styles.ghostText, { color: p.textMuted }]}>Ahora no</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={downloading}
              style={[styles.primaryButton, { backgroundColor: p.accent }]}>
              {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryText}>Actualizar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '85%', borderRadius: 16, padding: 20 },
  title: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  body: {},
  error: { marginTop: 8, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 },
  ghostButton: { paddingVertical: 10, paddingHorizontal: 14 },
  ghostText: { fontWeight: '600' },
  primaryButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, minWidth: 90, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: 'bold' },
});
