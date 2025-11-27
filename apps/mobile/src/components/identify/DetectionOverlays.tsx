import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { ObjectDetectionResult } from '~/ml/objectDetector';

type DetectionOverlaysProps = {
  results: ObjectDetectionResult;
  imageUri: string;
};

export const DetectionOverlays: React.FC<DetectionOverlaysProps> = ({ results }) => {
  if (!results?.detections?.length) return null;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Camera view is 16:9, model processes square (320x320)
  // Assuming center square crop from 16:9 image
  const cameraAspectRatio = 16 / 9;
  const screenAspectRatio = screenWidth / screenHeight;

  // Calculate the square crop dimensions in screen coordinates
  let cropWidth, cropHeight, xOffset, yOffset;

  if (screenAspectRatio > cameraAspectRatio) {
    // Screen is wider than 16:9 (letterboxed)
    cropHeight = screenHeight;
    cropWidth = screenHeight; // Square crop
    xOffset = (screenWidth - cropWidth) / 2;
    yOffset = 0;
  } else {
    // Screen is taller than 16:9 (pillarboxed) - unlikely for mobile
    cropWidth = screenWidth;
    cropHeight = screenWidth / cameraAspectRatio; // 16:9 height for square width
    xOffset = 0;
    yOffset = (screenHeight - cropHeight) / 2;
  }

  const labels = [
    'paper_cardboard',
    'glass',
    'recyclables',
    'bio_waste',
    'textile_reuse',
    'electronics',
    'battery',
    'residual_waste',
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {results.detections.map(({ bbox, class: classProbs }, index: number) => {
        if (!bbox || bbox.length !== 4) return null;

        // Get the highest confidence class
        const maxProbIndex = classProbs.indexOf(Math.max(...classProbs));
        const detectedLabel = labels[maxProbIndex].replace(/_/g, ' ');
        const confidence = classProbs[maxProbIndex];

        // Convert normalized coordinates from square crop to screen coordinates
        const x1 = bbox[0] * cropWidth + xOffset;
        const y1 = bbox[1] * cropHeight + yOffset;
        const x2 = bbox[2] * cropWidth + xOffset;
        const y2 = bbox[3] * cropHeight + yOffset;

        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;

        return (
          <React.Fragment key={index}>
            {/* Bounding Box */}
            <View
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: boxWidth,
                height: boxHeight,
                borderWidth: 3,
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
              }}
            />
            {/* Label */}
            <View
              style={{
                position: 'absolute',
                left: x1,
                top: y1 - 30,
                backgroundColor: '#10b981',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}>
                {detectedLabel} {(confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};
