import ReactNativeBlobUtil from 'react-native-blob-util';

export async function downloadAndInstallApk(apkUrl: string): Promise<void> {
  const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
  const path = `${dir}/fondo-update.apk`;

  const res = await ReactNativeBlobUtil.config({ path }).fetch('GET', apkUrl);
  const status = res.info().status;
  if (status !== 200) {
    throw new Error(`No se pudo descargar la actualización (HTTP ${status})`);
  }

  await ReactNativeBlobUtil.android.actionViewIntent(res.path(), 'application/vnd.android.package-archive');
}
