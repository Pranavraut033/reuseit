import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ClassificationResult } from '~/ml/classifier';
import { ObjectDetectionResult } from '~/ml/objectDetector';

import { DetectionOverlays } from './DetectionOverlays';
import { DetectionResults } from './DetectionResults';

type BaseImagePreviewProps = {
  pickedImage: string;
  setPickedImage: React.Dispatch<React.SetStateAction<string | null>>;
  ready: boolean;
  loading: boolean;
  error: string | null;
  runInference: (uri: string) => void;
};

type ImagePreviewProps =
  | (BaseImagePreviewProps & {
      detectionMode: 'classification';
      results: ClassificationResult[] | null;
    })
  | (BaseImagePreviewProps & {
      detectionMode: 'detection';
      results: ObjectDetectionResult | null;
    });

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  pickedImage,
  setPickedImage,
  ready,
  loading,
  error,
  results,
  detectionMode,
  runInference,
}) => {
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.9)',
      }}
      className="justify-end">
      {/* Full Screen Image with Overlays */}
      <View className="relative flex-1">
        <Image
          source={{ uri: pickedImage }}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
        {/* Detection Overlays */}
        {results && !loading && detectionMode === 'detection' && (
          <DetectionOverlays results={results as ObjectDetectionResult} imageUri={pickedImage} />
        )}
      </View>

      {/* Bottom Panel */}
      <View className="rounded-t-3xl bg-black/80 px-6 py-8 pb-12 backdrop-blur-lg">
        <View className="mb-6 items-center">
          <Text className="mb-2 text-2xl font-bold text-white">Waste Identified</Text>
          {!ready && <Text className="text-white/80">Initializing AI...</Text>}
          {loading && ready && (
            <View className="mt-4 items-center gap-3">
              <ActivityIndicator size={40} color={'#10b981'} />
              <Text className="text-lg text-white/80">
                {detectionMode === 'detection' ? 'Detecting objects...' : 'Analyzing image...'}
              </Text>
            </View>
          )}
          {error && (
            <View className="mt-4 rounded-xl bg-red-500/20 p-4">
              <Text className="text-center text-red-300">{error}</Text>
            </View>
          )}
        </View>

        {results && !loading && detectionMode === 'classification' && (
          <View className="mb-6 gap-3">
            {results.slice(0, 3).map((r) => (
              <View
                key={r.label}
                className="rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold capitalize text-white">
                    {r.label.replace(/_/g, ' ')}
                  </Text>
                  <View className="rounded-full bg-emerald-500/20 px-3 py-1">
                    <Text className="font-bold text-emerald-300">
                      {(r.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {results && !loading && detectionMode === 'detection' && (
          <View className="mb-6">
            <DetectionResults results={results} />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => setPickedImage(null)}
            className="flex-1 items-center rounded-2xl bg-white/10 py-4">
            <Text className="text-lg font-semibold text-white">Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading || !ready}
            onPress={() => pickedImage && runInference(pickedImage)}
            className="flex-1 items-center rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 py-4 disabled:opacity-50">
            <Text className="text-lg font-bold text-white">Re-scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={
              !results || (detectionMode === 'classification' && !(results as any[]).length)
            }
            onPress={() => {
              if (detectionMode !== 'classification' || !results?.length) return;
              const top = results[0];

              router.push({
                pathname: '/identify/detail',
                params: { photo: pickedImage!, label: top.label },
              });
            }}
            className="flex-1 items-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 disabled:opacity-50">
            <Text className="text-lg font-bold text-white">Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
