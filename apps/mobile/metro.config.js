const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// Allow bundling of TensorFlow Lite model assets (.tflite)
const assetExts = config.resolver.assetExts || [];
if (!assetExts.includes('tflite')) {
  config.resolver.assetExts = [...assetExts, 'tflite'];
}

config.watchFolders = [path.resolve(repoRoot, 'node_modules')];

// Ensure metro resolves only one copy of react and react-native
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
