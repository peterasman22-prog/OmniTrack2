import { create } from 'zustand';
import type { Venue, Floor, Zone } from '@/types/venue';
import { venuesApi } from '@/services/api';

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  selectedFloor: Floor | null;
  zones: Zone[];
  isLoading: boolean;
  error: string | null;
  
  fetchVenues: () => Promise<void>;
  selectVenue: (venue: Venue | null) => void;
  selectFloor: (floor: Floor | null) => void;
  fetchZones: (venueId: string, floorId?: string) => Promise<void>;
}

export const useVenueStore = create<VenueState>((set) => ({
  venues: [],
  selectedVenue: null,
  selectedFloor: null,
  zones: [],
  isLoading: false,
  error: null,

  fetchVenues: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await venuesApi.getAll();
      set({ venues: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch venues', 
        isLoading: false 
      });
    }
  },

  selectVenue: (venue) => {
    set({ selectedVenue: venue, selectedFloor: null });
  },

  selectFloor: (floor) => {
    set({ selectedFloor: floor });
  },

  fetchZones: async (venueId, floorId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await venuesApi.getZones(venueId, floorId);
      set({ zones: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch zones', 
        isLoading: false 
      });
    }
  },
}));
