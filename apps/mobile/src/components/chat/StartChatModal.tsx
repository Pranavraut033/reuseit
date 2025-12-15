import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CREATE_CHAT } from '~/gql/posts';
import { t, tRaw } from '~/utils/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postType?: string;
  onChatCreated: (chatId: string) => void;
};

const StartChatModal: React.FC<Props> = ({ visible, onClose, postId, postType, onChatCreated }) => {
  const [text, setText] = useState('');

  const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT);

  const isGiveaway = postType === 'GIVEAWAY';
  const isRequest = postType === 'REQUESTS';

  const placeholder = useMemo(() => {
    if (isGiveaway) return t('postChat.placeholderOffer');
    if (isRequest) return t('postChat.placeholderRequest');
    return t('postChat.placeholder');
  }, [isGiveaway, isRequest]);

  const suggestions = useMemo(() => {
    const raw = tRaw(
      'postChat.suggestions.' + (isGiveaway ? 'offer' : isRequest ? 'request' : 'default'),
    );
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string') return [raw];
    return [] as string[];
  }, [isGiveaway, isRequest]);

  const handleSuggestion = (s: string) => setText(s);

  const handleSend = async () => {
    try {
      const res = await createChat({
        variables: { createChatInput: { postId, message: text.trim() } },
      });
      const chatId = res?.data?.createChat?.id;
      if (!chatId) throw new Error('Chat creation failed');
      onChatCreated(chatId);
      setText('');
      onClose();
    } catch (error) {
      console.error('Error creating chat with message:', error);
    }
  };

  const loading = creatingChat;

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent>
      <BottomSheet
        index={visible ? 1 : -1}
        snapPoints={['50%', '75%', '100%']}
        enablePanDownToClose
        onClose={onClose}>
        <BottomSheetView>
          <View className="p-md">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-forest">{t('postChat.title')}</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('postChat.cancel')}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              className="mb-3 mt-3 rounded-md border border-gray-200 p-sm text-sm"
              multiline
              maxLength={500}
              accessibilityLabel={t('postCreate.description')}
            />

            <View className="mb-3 flex-row flex-wrap gap-2">
              {suggestions.map((s: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSuggestion(s)}
                  className="rounded-full border-2 border-gray-200 bg-gray-50 px-3 py-2"
                  accessibilityRole="button"
                  accessibilityLabel={s}>
                  <Text className="text-sm text-gray-700">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={onClose}
                className="items-center justify-center rounded-md border-2 border-primary px-3 py-2"
                accessibilityRole="button"
                accessibilityLabel={t('postChat.cancel')}>
                <Text className="text-sm text-primary">{t('postChat.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSend}
                disabled={loading}
                className={`items-center justify-center rounded-full px-4 py-3 shadow-card ${
                  text.trim() ? 'bg-primary' : 'pointer-events-none bg-gray-300 opacity-50'
                }`}
                accessibilityRole="button"
                accessibilityLabel={t('postChat.send')}>
                <Text className="text-sm text-white">{t('postChat.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
};

export default StartChatModal;
