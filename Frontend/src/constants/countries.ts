export interface CountryInfo {
  code: string;
  name: string;
  label: string;
  defaultRegion: string;
  defaultCity: string;
  coordinates: { lat: number; lng: number };
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: 'GH',
    name: 'GHANA',
    label: 'Ghana (West Africa)',
    defaultRegion: 'Ashanti',
    defaultCity: 'Kumasi',
    coordinates: { lat: 6.6885, lng: -1.6244 },
  },
  {
    code: 'CI',
    name: "CÔTE D'IVOIRE",
    label: "Côte d'Ivoire (West Africa)",
    defaultRegion: 'Yamoussoukro',
    defaultCity: 'Yamoussoukro',
    coordinates: { lat: 6.8276, lng: -5.2893 },
  },
  {
    code: 'NG',
    name: 'NIGERIA',
    label: 'Nigeria (West Africa)',
    defaultRegion: 'Kaduna',
    defaultCity: 'Kaduna',
    coordinates: { lat: 10.5105, lng: 7.4165 },
  },
  {
    code: 'KE',
    name: 'KENYA',
    label: 'Kenya (East Africa)',
    defaultRegion: 'Rift Valley',
    defaultCity: 'Nakuru',
    coordinates: { lat: -0.3031, lng: 36.08 },
  },
  {
    code: 'NO',
    name: 'NORWAY',
    label: 'Norway (Northern Europe)',
    defaultRegion: 'Innlandet',
    defaultCity: 'Hamar',
    coordinates: { lat: 60.7945, lng: 11.068 },
  },
];
