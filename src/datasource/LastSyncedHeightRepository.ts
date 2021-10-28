export interface LastSyncedHeightRepository {
  load(): Promise<number>;
  save(height: number): Promise<void>;
}

export const saveLastSyncedHeightInMemory = (initialHeight: number): LastSyncedHeightRepository => ({
  async load(): Promise<number> {
    return initialHeight;
  },
  async save(height: number): Promise<void> {},
});

const HIVE_PERSISTENCE_PK = 'hype-last-synced-height';

export interface HivePersistenceLike<T = any> {
  setBatch<R = T>(
    batchData: {
      pk: string;
      sk: string | number | Buffer;
      data: R;
    }[],
  ): Promise<boolean>;
  getLatest<R = T>(entityName: string): Promise<R>;
}

export const saveLastSyncedHeightInHivePersistence = (
  p: HivePersistenceLike,
  initialHeight: number,
): LastSyncedHeightRepository => {
  interface PersistedState {
    lastSyncedHeight: number;
  }
  const persistence = p as HivePersistenceLike<PersistedState>;
  return {
    async load(): Promise<number> {
      const persistedState = await persistence.getLatest(HIVE_PERSISTENCE_PK);
      return persistedState?.lastSyncedHeight ?? initialHeight;
    },
    async save(lastSyncedHeight: number): Promise<void> {
      await persistence.setBatch([{ pk: HIVE_PERSISTENCE_PK, sk: 0, data: { lastSyncedHeight } }]);
    },
  };
};
