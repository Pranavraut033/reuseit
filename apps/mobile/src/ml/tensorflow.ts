import '@tensorflow/tfjs-react-native';

import * as tf from '@tensorflow/tfjs';

let initializedBackend: string | null = null;
let initializing = false;
const initWaiters: ((b: string) => void)[] = [];

export async function initTensorflow(
  preferredBackend: 'rn-webgl' | 'cpu' = 'rn-webgl',
): Promise<string> {
  if (initializedBackend) return initializedBackend;
  if (initializing) {
    return new Promise((resolve) => initWaiters.push(resolve));
  }
  initializing = true;
  await tf.ready();

  const available = Object.keys(tf.engine().registry);
  if (available.includes(preferredBackend)) {
    await tf.setBackend(preferredBackend);
    await tf.ready();
  }

  initializedBackend = tf.getBackend();
  initializing = false;
  initWaiters.forEach((fn) => fn(initializedBackend!));
  initWaiters.length = 0;
  return initializedBackend;
}

export function getTF() {
  if (!initializedBackend)
    throw new Error('TensorFlow not initialized yet. Call initTensorflow first.');
  return tf;
}
