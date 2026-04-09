import { useState, useRef, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextStyle,
  type KeyboardTypeOptions,
} from 'react-native';

interface Props {
  value: string;
  onSave: (value: string) => void;
  style?: TextStyle;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  numberOfLines?: number;
}

export function EditableField({
  value,
  onSave,
  style,
  keyboardType = 'default',
  placeholder = 'Tap to edit',
  numberOfLines = 1,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  const handleDone = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  if (editing) {
    return (
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        value={draft}
        onChangeText={setDraft}
        onBlur={handleDone}
        onSubmitEditing={handleDone}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        numberOfLines={numberOfLines}
        selectTextOnFocus
        returnKeyType="done"
      />
    );
  }

  return (
    <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.6}>
      <Text style={[style, !value && styles.placeholder]} numberOfLines={numberOfLines}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingVertical: 2,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  placeholder: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
