const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

const withCustomNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = await setCustomConfigAsync(config, config.modResults);
    return config;
  });
};

async function setCustomConfigAsync(config, androidManifest) {
  const srcFile = path.join(__dirname, 'network_security_config.xml');
  // Use the public API AndroidConfig.Paths.getResourceFolderAsync when available
  const resourceFolder =
    AndroidConfig && AndroidConfig.Paths && AndroidConfig.Paths.getResourceFolderAsync
      ? await AndroidConfig.Paths.getResourceFolderAsync(config.modRequest.projectRoot)
      : // fallback: assume standard Android project path inside prebuild
        path.join(config.modRequest.projectRoot, 'android', 'app', 'src', 'main', 'res');

  const resFilePath = path.join(resourceFolder, 'xml', 'network_security_config.xml');

  const resDir = path.resolve(resFilePath, '..');
  if (!fs.existsSync(resDir)) {
    await fsPromises.mkdir(resDir, { recursive: true });
  }

  await fsPromises.copyFile(srcFile, resFilePath);

  const mainApplication = getMainApplicationOrThrow(androidManifest);
  mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

  return androidManifest;
}

module.exports = withCustomNetworkSecurityConfig;
