import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import ClientCard from '@/components/clients/ClientCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
import { queryKeys } from '@/constants/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { getWorkspace, saveWorkspace } from '@/services/api/workspaceApi';
import { filterClients } from '@/utils/clients';
import { moderateScale } from '@/utils/responsive';

export default function ClientsScreen() {
  const router = useRouter();
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { clients, isLoading, isError, error, refetch, isRefetching } = useClients();
  const [pendingDeleteRowKey, setPendingDeleteRowKey] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (isLoading) {
    return <LoadingScreen message="Loading clients..." />;
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={refetch} />;
  }

  const filtered = filterClients(clients, search);

  async function handleConfirmDeleteClient() {
    const rowKey = pendingDeleteRowKey;
    setIsDeletingClient(true);
    setDeleteError('');
    try {
      // Same full-sheet-replace contract the create-client flow uses — fetch
      // the latest workspace first, then save it back minus this one row, so
      // no other client's row is ever touched.
      const current = await getWorkspace();
      const nextRows = current.rows.filter((row) => row.id !== rowKey);
      await saveWorkspace({ ...current, rows: nextRows }, employee?.id);
      setPendingDeleteRowKey(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ]);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete client.');
    } finally {
      setIsDeletingClient(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Clients</Text>
      <AppButton
        title="+ Create New Client"
        onPress={() => router.push('/clients/create')}
        style={styles.createButton}
      />
      <AppInput
        placeholder="Search by name, phone, or venue"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.rowKey}
        renderItem={({ item }) => <ClientCard client={item} onRequestDelete={setPendingDeleteRowKey} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="No clients found"
            message={search ? 'Try a different search term.' : 'No clients on the workspace yet.'}
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContent : styles.listContent}
      />

      {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}

      <ConfirmDialog
        visible={pendingDeleteRowKey !== null}
        title="Delete this row?"
        message="This row will be permanently removed and saved immediately. This action cannot be undone."
        confirmLabel="Yes, delete"
        isConfirming={isDeletingClient}
        onCancel={() => setPendingDeleteRowKey(null)}
        onConfirm={handleConfirmDeleteClient}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: Brand.purple,
    marginBottom: 12,
  },
  createButton: {
    marginBottom: 12,
  },
  search: {
    marginBottom: 12,
  },
  separator: {
    height: 10,
  },
  error: {
    color: '#d32f2f',
    fontSize: moderateScale(13),
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
