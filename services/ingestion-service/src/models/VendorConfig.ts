export interface VendorConfig {
  vendorId: string;
  name: string;
  authType: 'none' | 'api_key' | 'bearer' | 'basic';
  payloadSchema?: Record<string, any>;
}

// Default vendor configurations
export const defaultVendorConfigs: VendorConfig[] = [
  {
    vendorId: 'ubisense',
    name: 'Ubisense',
    authType: 'api_key',
  },
  {
    vendorId: 'cisco_dna',
    name: 'Cisco DNA Spaces',
    authType: 'bearer',
  },
  {
    vendorId: 'aruba',
    name: 'Aruba Meridian',
    authType: 'api_key',
  },
  {
    vendorId: 'generic',
    name: 'Generic RTLS',
    authType: 'none',
  },
];
