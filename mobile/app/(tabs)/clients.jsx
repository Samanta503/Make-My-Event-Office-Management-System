import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import AppInput from '@/components/common/AppInput';
import ClientCard from '@/components/clients/ClientCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
import { useClients } from '@/hooks/useClients';
import { filterClients } from '@/utils/clients';

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const { clients, isLoading, isError, error, refetch, isRefetching } = useClients();

  if (isLoading) {
    return <LoadingScreen message="Loading clients..." />;
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={refetch} />;
  }

  const filtered = filterClients(clients, search);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Clients</Text>
      <AppInput
        placeholder="Search by name, phone, or venue"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.rowKey}
        renderItem={({ item }) => <ClientCard client={item} />}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.purple,
    marginBottom: 12,
  },
  search: {
    marginBottom: 12,
  },
  separator: {
    height: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
