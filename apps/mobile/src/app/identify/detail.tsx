import { useLazyQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { FINALIZE_RECYCLING } from '~/gql/mutations/finalizeRecycling';
import { getRecyclingInfo } from '~/ml/recyclingInfo';
import { useWasteClassifier } from '~/ml/useWasteClassifier';

export default function IdentifyDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const photoUri = typeof params.photo === 'string' ? params.photo : undefined;
  const passedLabel = typeof params.label === 'string' ? params.label : undefined;
  const { ready, loading, results, classify } = useWasteClassifier();
  const [label, setLabel] = useState<string | undefined>(passedLabel);
  const [modalVisible, setModalVisible] = useState(false);
  const [backendAnalysis, setBackendAnalysis] = useState<any>(null);

  const [finalizeRecycling, { loading: backendLoading }] = useLazyQuery(FINALIZE_RECYCLING);

  useEffect(() => {
    if (!label && photoUri && ready) {
      classify(photoUri);
    }
  }, [label, photoUri, ready, classify]);

  useEffect(() => {
    if (!label && results && results.length) {
      setLabel(results[0].label);
    }
  }, [results, label]);

  // Fetch backend analysis when label is available
  const fetchBackendAnalysis = useCallback(async () => {
    if (!label) return;

    try {
      const materials = getMaterialsFromLabel(label);
      const result = await finalizeRecycling({
        variables: {
          input: {
            objectName: label,
            materials,
            city: 'Berlin', // TODO: Get from user location/settings
          },
        },
      });

      const data = result.data;
      if (data?.finalizeRecycling) {
        setBackendAnalysis(data.finalizeRecycling);
      }
    } catch (error) {
      console.error('Failed to fetch backend analysis:', error);
    }
  }, [label, finalizeRecycling]);

  const info = getRecyclingInfo(label || 'Unknown');
  const confidence = results?.find((r) => r.label === label)?.confidence;

  const handleBack = useCallback(() => router.back(), [router]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ marginBottom: 16 }}>
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={{ width: '100%', height: 280, borderRadius: 12 }}
              resizeMode="cover"
            />
          )}
        </View>
        <Text style={{ fontSize: 24, fontWeight: '600', color: 'white', marginBottom: 4 }}>
          Identification
        </Text>
        <Text style={{ fontSize: 16, color: 'white' }}>
          {label ? label : loading ? 'Classifying...' : 'Unknown Item'}
          {confidence != null && ` • ${(confidence * 100).toFixed(1)}% confidence`}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              backgroundColor: '#222',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontWeight: '500' }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!photoUri || loading || !ready}
            onPress={() => photoUri && classify(photoUri)}
            style={{
              backgroundColor: '#0c7c3d',
              opacity: !photoUri || loading || !ready ? 0.5 : 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontWeight: '500' }}>Re-run</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#444',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontWeight: '500' }}>Quick Facts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!label || backendLoading}
            onPress={fetchBackendAnalysis}
            style={{
              backgroundColor: '#1e40af',
              opacity: !label || backendLoading ? 0.5 : 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontWeight: '500' }}>
              {backendLoading ? 'Loading...' : 'Get Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: 'white', marginBottom: 8 }}>
            How to Recycle
          </Text>
          {backendAnalysis ? (
            <>
              <Text style={{ color: '#4ade80', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Bin: {backendAnalysis.recycling.bin}
              </Text>
              {backendAnalysis.recycling.cityOverride && (
                <Text style={{ color: '#fbbf24', marginBottom: 8 }}>
                  📍 {backendAnalysis.recycling.cityOverride} specific rules
                </Text>
              )}
              <Text style={{ color: 'white', marginBottom: 12, lineHeight: 20 }}>
                {backendAnalysis.instructions}
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
                Backend AI Analysis
              </Text>
            </>
          ) : (
            <>
              {info.steps.map((step) => (
                <Text key={step} style={{ color: 'white', marginBottom: 6 }}>
                  • {step}
                </Text>
              ))}
              {info.caution && (
                <Text style={{ color: '#ffcc66', marginTop: 8 }}>⚠ {info.caution}</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            padding: 24,
          }}>
          <View style={{ backgroundColor: '#121212', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 12 }}>
              Quick Facts
            </Text>
            <Text style={{ color: 'white', marginBottom: 16 }}>{info.short}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                backgroundColor: '#0c7c3d',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}>
              <Text style={{ color: 'white', fontWeight: '500' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper to extract materials from label
function getMaterialsFromLabel(label: string): string[] {
  const materialMap: Record<string, string[]> = {
    Plastic: ['plastic'],
    Paper: ['paper', 'cardboard'],
    Glass: ['glass'],
    Metal: ['metal', 'aluminum'],
    Organic: ['organic', 'food'],
    Unknown: ['mixed'],
  };
  return materialMap[label] || ['unknown'];
}
