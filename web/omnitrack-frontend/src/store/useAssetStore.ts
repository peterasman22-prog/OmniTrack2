import { create } from 'zustand';
import type { Asset, AssetPosition, AssetWithPosition } from '@/types/asset';
import { assetsApi } from '@/services/api';

interface AssetState {
  assets: AssetWithPosition[];
  selectedAsset: AssetWithPosition | null;
  positions: Map<string, AssetPosition>;
  isLoading: boolean;
  error: string | null;
  
  fetchAssets: (venueId?: string) => Promise<void>;
  fetchAssetById: (id: string) => Promise<void>;
  updatePosition: (position: AssetPosition) => void;
  selectAsset: (asset: AssetWithPosition | null) => void;
  createAsset: (data: Partial<Asset>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  selectedAsset: null,
  positions: new Map(),
  isLoading: false,
  error: null,

  fetchAssets: async (venueId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assetsApi.getAll(venueId);
      set({ assets: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch assets', 
        isLoading: false 
      });
    }
  },

  fetchAssetById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const [assetRes, positionRes] = await Promise.all([
        assetsApi.getById(id),
        assetsApi.getPosition(id).catch(() => ({ data: null })),
      ]);
      
      const asset: AssetWithPosition = {
        ...assetRes.data,
        position: positionRes.data || undefined,
      };
      
      set({ selectedAsset: asset, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch asset', 
        isLoading: false 
      });
    }
  },

  updatePosition: (position) => {
    const { positions, assets } = get();
    const newPositions = new Map(positions);
    newPositions.set(position.assetId, position);
    
    const updatedAssets = assets.map(asset => 
      asset.id === position.assetId 
        ? { ...asset, position, lastSeen: position.timestamp }
        : asset
    );
    
    set({ positions: newPositions, assets: updatedAssets });
  },

  selectAsset: (asset) => {
    set({ selectedAsset: asset });
  },

  createAsset: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assetsApi.create(data);
      const { assets } = get();
      set({ 
        assets: [...assets, response.data], 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create asset', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateAsset: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assetsApi.update(id, data);
      const { assets } = get();
      set({ 
        assets: assets.map(a => a.id === id ? response.data : a), 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update asset', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await assetsApi.delete(id);
      const { assets } = get();
      set({ 
        assets: assets.filter(a => a.id !== id), 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete asset', 
        isLoading: false 
      });
      throw error;
    }
  },
}));
