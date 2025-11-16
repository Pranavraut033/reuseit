import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { t } from '~/utils/i18n';
import { getPopularTags, suggestTags, TagSuggestion } from '~/utils/tagSuggestion';

interface TagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  category?: string;
  condition?: string;
  description?: string;
  maxTags?: number;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  onTagsChange,
  category,
  condition,
  description,
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load tag suggestions based on context

  const loadSuggestions = useCallback(async () => {
    if (!category && !condition && !description) {
      // Show popular tags if no context
      const popular = getPopularTags();
      setSuggestions(popular.map((tag) => ({ tag, confidence: 0.5 })));
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const contextText = `${description || ''} ${category || ''} ${condition || ''}`;
      const suggested = await suggestTags(contextText, category, condition);

      // Filter out already added tags
      const filteredSuggestions = suggested.filter((s) => !tags.includes(s.tag));

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error loading tag suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [category, condition, description, tags]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();

      if (!trimmedTag) return;

      if (tags.length >= maxTags) {
        return;
      }

      if (tags.includes(trimmedTag)) {
        return;
      }

      const newTags = [...tags, trimmedTag];
      onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);

      // Update suggestions to exclude newly added tag
      setSuggestions((prev) => prev.filter((s) => s.tag !== trimmedTag));
    },
    [tags, onTagsChange, maxTags],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      onTagsChange(newTags);

      // Reload suggestions after removing a tag
      loadSuggestions();
    },
    [tags, onTagsChange, loadSuggestions],
  );

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(text.length > 0);
  };

  const handleSubmitTag = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const getFilteredSuggestions = () => {
    if (!inputValue) return suggestions;

    const lowerInput = inputValue.toLowerCase();
    return suggestions.filter((s) => s.tag.toLowerCase().includes(lowerInput));
  };

  const renderTag = (tag: string) => (
    <View key={tag} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
      <TouchableOpacity
        onPress={() => removeTag(tag)}
        style={styles.tagRemove}
        accessible={true}
        accessibilityLabel={`Remove ${tag} tag`}
        accessibilityRole="button"
      >
        <Ionicons name="close-circle" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestion = (suggestion: TagSuggestion) => (
    <TouchableOpacity
      key={suggestion.tag}
      style={styles.suggestionChip}
      onPress={() => addTag(suggestion.tag)}
      accessible={true}
      accessibilityLabel={`Add ${suggestion.tag} tag`}
      accessibilityRole="button"
    >
      <Ionicons name="add-circle-outline" size={16} color="#3B82F6" />
      <Text style={styles.suggestionText}>{suggestion.tag}</Text>
      {suggestion.confidence > 0.7 && (
        <View style={styles.confidenceBadge}>
          <Ionicons name="sparkles" size={12} color="#F59E0B" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('postCreate.tags')}</Text>
        <Text style={styles.headerCount}>
          {tags.length}/{maxTags}
        </Text>
      </View>

      {/* Current Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          >
            {tags.map(renderTag)}
          </ScrollView>
        </View>
      )}

      {/* Tag Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('postCreate.tagsPlaceholder')}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmitTag}
          returnKeyType="done"
          maxLength={30}
          editable={tags.length < maxTags}
          accessible={true}
          accessibilityLabel={t('accessibility.tagInput')}
        />
        {inputValue.trim() && (
          <TouchableOpacity
            onPress={handleSubmitTag}
            style={styles.addButton}
            accessible={true}
            accessibilityLabel="Add tag"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {/* ML Suggestions */}
      {isLoadingSuggestions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Generating suggestions...</Text>
        </View>
      ) : (
        <>
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Ionicons name="bulb-outline" size={16} color="#6B7280" />
                <Text style={styles.suggestionsHeaderText}>Suggested Tags</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScrollContent}
              >
                {getFilteredSuggestions().slice(0, 8).map(renderSuggestion)}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {/* Education Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.tipText}>{t('postCreate.tip3')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  tagRemove: {
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  suggestionsHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  suggestionsScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1E40AF',
  },
  confidenceBadge: {
    marginLeft: 4,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
});
