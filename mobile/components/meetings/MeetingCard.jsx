import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import NextCallFields from '@/components/calls/NextCallFields';
import ItemDraftForm from '@/components/meetings/ItemDraftForm';
import ItemSelectModal from '@/components/meetings/ItemSelectModal';
import MeetingItemDisplay from '@/components/meetings/MeetingItemDisplay';
import { Brand } from '@/constants/theme';
import { CLIENT_REQUIREMENT_OPTIONS } from '@/constants/meetingItems';
import { useAuth } from '@/hooks/useAuth';
import {
  createMeetingItem,
  deleteMeetingItem,
  updateMeeting,
  updateMeetingItem,
  uploadMeetingItemImages,
} from '@/services/api/meetingsApi';
import { toDateTimeLocalString } from '@/utils/dates';

const LABELS = Object.fromEntries(CLIENT_REQUIREMENT_OPTIONS.map((option) => [option.key, option.label]));

function itemLabel(item) {
  return item.itemKey === 'other' ? item.customLabel || 'Other' : LABELS[item.itemKey] || item.itemKey;
}

// Fully controlled — no own state/API calls. Edits are held in the parent's
// `itemEdits` map and only persisted when the card's single Save button is
// pressed, so there's exactly one save action for the whole card.
function MeetingItemEditRow({ item, value, onChange, onRequestDelete }) {
  return (
    <View style={styles.itemEditRow}>
      <View style={styles.itemEditHeader}>
        <Text style={styles.itemEditLabel}>{itemLabel(item)}</Text>
        <Pressable onPress={() => onRequestDelete(item)}>
          <Text style={styles.deleteLink}>Delete</Text>
        </Pressable>
      </View>

      <AppInput
        value={value.description}
        onChangeText={(text) => onChange({ ...value, description: text })}
        placeholder="Description"
        multiline
        style={styles.itemDescriptionInput}
      />

      <View style={styles.quantityRow}>
        <Text style={styles.quantityLabel}>Quantity</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => onChange({ ...value, quantity: Math.max(1, value.quantity - 1) })}>
            <Text style={styles.stepButtonText}>{'\u2212'}</Text>
          </Pressable>
          <Text style={styles.quantityValue}>{value.quantity}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() => onChange({ ...value, quantity: value.quantity + 1 })}>
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MeetingCard({
  meeting,
  rowKey,
  onToggleComplete,
  onRequestDeleteMeeting,
  onChanged,
  isTogglingComplete,
}) {
  const { employee } = useAuth();
  const hasContent = meeting.items.length > 0;
  const [isEditing, setIsEditing] = useState(!hasContent);
  const [nextMeetingDate, setNextMeetingDate] = useState(
    meeting.nextMeetingDatetime ? new Date(meeting.nextMeetingDatetime) : new Date(),
  );
  // Defaults to the current employee — an unassigned next meeting is
  // invisible on every calendar (backend filters by assignedEmployeeId), so
  // it must never be left null unless explicitly cleared.
  const [nextMeetingEmployeeId, setNextMeetingEmployeeId] = useState(
    meeting.nextMeetingAssignedEmployeeId || employee?.id || null,
  );
  const [itemEdits, setItemEdits] = useState({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function getItemValue(item) {
    return itemEdits[item.id] || { description: item.description || '', quantity: item.quantity };
  }

  function setItemValue(item, value) {
    setItemEdits((prev) => ({ ...prev, [item.id]: value }));
  }

  function handleEdit() {
    setError('');
    setItemEdits({});
    setNextMeetingDate(meeting.nextMeetingDatetime ? new Date(meeting.nextMeetingDatetime) : new Date());
    setNextMeetingEmployeeId(meeting.nextMeetingAssignedEmployeeId || employee?.id || null);
    setIsEditing(true);
  }

  function handleItemSelected(selection) {
    setPendingItem({ ...selection, description: '', quantity: 1, images: [] });
  }

  async function handleConfirmAddItem() {
    if (!pendingItem) return;
    setIsAddingItem(true);
    setError('');
    try {
      const created = await createMeetingItem(rowKey, meeting.id, {
        itemKey: pendingItem.itemKey,
        customLabel: pendingItem.customLabel,
        description: pendingItem.description,
        quantity: pendingItem.quantity,
      });
      if (pendingItem.images?.length) {
        await uploadMeetingItemImages(rowKey, meeting.id, created.id, pendingItem.images);
      }
      setPendingItem(null);
      onChanged();
    } catch (err) {
      setError(err.message || 'Failed to add item.');
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleConfirmDeleteItem() {
    if (!pendingDeleteItem) return;
    setIsDeletingItem(true);
    setError('');
    try {
      await deleteMeetingItem(rowKey, meeting.id, pendingDeleteItem.id);
      setPendingDeleteItem(null);
      onChanged();
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    } finally {
      setIsDeletingItem(false);
    }
  }

  // The one Save button for the whole card — persists every edited item's
  // description/quantity plus the next-meeting fields together in one go.
  async function handleSaveAll() {
    setIsSaving(true);
    setError('');
    try {
      const nextMeetingChanged =
        toDateTimeLocalString(nextMeetingDate) !==
          (meeting.nextMeetingDatetime ? toDateTimeLocalString(new Date(meeting.nextMeetingDatetime)) : '') ||
        String(nextMeetingEmployeeId || '') !== String(meeting.nextMeetingAssignedEmployeeId || employee?.id || '');

      if (nextMeetingChanged) {
        await updateMeeting(rowKey, meeting.id, {
          nextMeetingDatetime: toDateTimeLocalString(nextMeetingDate),
          nextMeetingAssignedEmployeeId: nextMeetingEmployeeId,
        });
      }

      await Promise.all(
        Object.entries(itemEdits).map(([itemId, value]) =>
          updateMeetingItem(rowKey, meeting.id, itemId, {
            description: value.description,
            quantity: value.quantity,
          }),
        ),
      );

      setItemEdits({});
      setIsEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'Failed to save meeting.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={[styles.card, meeting.isCompleted && styles.cardCompleted]}>
      <View style={styles.headerRow}>
        <Text style={styles.date}>{meeting.meetingDatetime}</Text>
        <Pressable onPress={() => onToggleComplete(meeting.id)} disabled={isTogglingComplete}>
          <Text style={[styles.completeBadge, meeting.isCompleted && styles.completeBadgeDone]}>
            {meeting.isCompleted ? 'Completed' : 'Mark Complete'}
          </Text>
        </Pressable>
      </View>

      {meeting.createdByName ? <Text style={styles.meta}>Logged by {meeting.createdByName}</Text> : null}
      {meeting.assignedByEmployeeName ? (
        <Text style={styles.meta}>Assigned by {meeting.assignedByEmployeeName}</Text>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Requirements</Text>
      </View>

      {meeting.items.length === 0 && !isEditing ? (
        <Text style={styles.emptyItems}>No requirements added.</Text>
      ) : null}

      {isEditing
        ? meeting.items.map((item) => (
            <MeetingItemEditRow
              key={item.id}
              item={item}
              value={getItemValue(item)}
              onChange={(value) => setItemValue(item, value)}
              onRequestDelete={setPendingDeleteItem}
            />
          ))
        : meeting.items.map((item) => <MeetingItemDisplay key={item.id} item={item} />)}

      {isEditing ? (
        pendingItem ? (
          <ItemDraftForm
            selectedItem={pendingItem}
            value={pendingItem}
            onChange={setPendingItem}
            onAdd={handleConfirmAddItem}
            onCancel={() => setPendingItem(null)}
          />
        ) : (
          <Pressable style={styles.selectItemButton} onPress={() => setIsPickerOpen(true)}>
            <Text style={styles.selectItemButtonText}>{isAddingItem ? 'Adding...' : '+ Add Item'}</Text>
          </Pressable>
        )
      ) : null}

      <Text style={styles.next}>
        Next meeting:{' '}
        {meeting.nextMeetingDatetime
          ? `${meeting.nextMeetingDatetime}${
              meeting.nextMeetingAssignedEmployeeName ? ` \u00b7 ${meeting.nextMeetingAssignedEmployeeName}` : ''
            }`
          : 'Not scheduled'}
      </Text>

      {isEditing ? (
        <View style={styles.form}>
          <Text style={styles.nextMeetingLabel}>Next Meeting</Text>
          <NextCallFields
            value={nextMeetingDate}
            onChange={setNextMeetingDate}
            employeeId={nextMeetingEmployeeId}
            onEmployeeChange={setNextMeetingEmployeeId}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footerActions}>
        {isEditing ? (
          <AppButton title="Save" onPress={handleSaveAll} loading={isSaving} style={styles.footerButton} />
        ) : (
          <AppButton title="Edit" variant="outline" onPress={handleEdit} style={styles.footerButton} />
        )}
        <AppButton
          title="Delete"
          variant="danger"
          onPress={() => onRequestDeleteMeeting(meeting.id)}
          style={styles.footerButton}
        />
      </View>

      <ItemSelectModal
        visible={isPickerOpen}
        existingKeys={meeting.items.map((item) => item.itemKey)}
        onSelect={handleItemSelected}
        onClose={() => setIsPickerOpen(false)}
      />

      <ConfirmDialog
        visible={pendingDeleteItem !== null}
        title="Delete this item?"
        message={
          pendingDeleteItem
            ? `Remove "${itemLabel(pendingDeleteItem)}" and its images? This cannot be undone.`
            : ''
        }
        confirmLabel="Yes, delete"
        isConfirming={isDeletingItem}
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={handleConfirmDeleteItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.pink,
    gap: 4,
  },
  cardCompleted: {
    backgroundColor: '#f4fbf6',
    borderColor: '#bfe6c9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
  },
  completeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.plum,
    borderWidth: 1,
    borderColor: Brand.pink,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  completeBadgeDone: {
    color: '#1a7d3a',
    borderColor: '#bfe6c9',
    backgroundColor: '#e4f7e9',
  },
  meta: {
    fontSize: 12,
    color: Brand.mauve,
  },
  sectionHeader: {
    marginTop: 8,
  },
  deleteLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d32f2f',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.mauve,
    textTransform: 'uppercase',
  },
  emptyItems: {
    fontSize: 13,
    color: Brand.mauve,
    fontStyle: 'italic',
  },
  itemEditRow: {
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.blush,
  },
  itemEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemEditLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
  },
  itemDescriptionInput: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.mauve,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 16,
    color: Brand.plum,
    fontWeight: '700',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
    minWidth: 20,
    textAlign: 'center',
  },
  selectItemButton: {
    borderWidth: 1,
    borderColor: Brand.pink,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  selectItemButtonText: {
    fontSize: 13,
    color: Brand.plum,
    fontWeight: '600',
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
  },
  next: {
    fontSize: 12,
    color: Brand.plum,
    fontWeight: '600',
    marginTop: 8,
  },
  nextMeetingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.purple,
  },
  form: {
    marginTop: 6,
    gap: 10,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  footerButton: {
    flex: 1,
  },
});
