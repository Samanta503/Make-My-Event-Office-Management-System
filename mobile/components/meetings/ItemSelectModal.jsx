import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { CLIENT_REQUIREMENT_OPTIONS } from '@/constants/meetingItems';
import { SCREEN_HEIGHT, moderateScale } from '@/utils/responsive';

export default function ItemSelectModal({ visible, existingKeys = [], onSelect, onClose }) {
  const [otherLabel, setOtherLabel] = useState('');
  const [pendingOther, setPendingOther] = useState(false);

  const available = CLIENT_REQUIREMENT_OPTIONS.filter(
    (option) => option.key === 'other' || !existingKeys.includes(option.key),
  );

  function handlePick(option) {
    if (option.key === 'other') {
      setPendingOther(true);
      return;
    }
    onSelect({ itemKey: option.key, customLabel: '', label: option.label });
    handleClose();
  }

  function handleConfirmOther() {
    const trimmed = otherLabel.trim();
    if (!trimmed) return;
    onSelect({ itemKey: 'other', customLabel: trimmed, label: trimmed });
    handleClose();
  }

  function handleClose() {
    setOtherLabel('');
    setPendingOther(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Select Requirement</Text>

          {!pendingOther ? (
            <FlatList
              data={available}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <Pressable style={styles.option} onPress={() => handlePick(item)}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
              style={styles.list}
            />
          ) : (
            <View style={styles.otherForm}>
              <TextInput
                style={styles.otherInput}
                placeholder="Custom requirement name"
                value={otherLabel}
                onChangeText={setOtherLabel}
                placeholderTextColor={Brand.mauve}
                autoFocus
              />
              <Pressable style={styles.confirmButton} onPress={handleConfirmOther}>
                <Text style={styles.confirmButtonText}>Add</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={handleClose} style={styles.cancelRow}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Brand.purple,
    marginBottom: 10,
  },
  list: {
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.blush,
  },
  optionText: {
    fontSize: moderateScale(14),
    color: Brand.purple,
    fontWeight: '600',
  },
  otherForm: {
    gap: 10,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: Brand.pink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: moderateScale(14),
    color: Brand.purple,
  },
  confirmButton: {
    backgroundColor: Brand.plum,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: Brand.mauve,
    fontWeight: '600',
  },
});
