import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { theme } from '../theme';
import { Feather } from '@expo/vector-icons';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label?: string;
  selectedValue?: string;
  value?: string;
  options?: PickerOption[];
  items?: PickerOption[];
  onValueChange: (value: string, itemIndex?: number) => void;
  placeholder?: string;
  containerStyle?: any;
}

export function Picker({ 
  label, 
  selectedValue, 
  value,
  options, 
  items,
  onValueChange, 
  placeholder,
  containerStyle 
}: PickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Support both 'items' and 'options' props, prefer 'items'
  const optionsList = items || options || [];
  const currentValue = selectedValue || value || '';
  const selectedOption = optionsList.find(opt => opt.value === currentValue);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder || 'Vyber možnosť'}
        </Text>
        <Feather name="chevron-down" size={20} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Vyber možnosť'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={optionsList}
              keyExtractor={(item) => item.value}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === currentValue && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value, index);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === currentValue && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === currentValue && (
                    <Feather name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom is now handled by containerStyle prop
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  pickerText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    flex: 1,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
});

