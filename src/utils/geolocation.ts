export interface GeolocationData {
  country_code: string;
  country_name: string;
}

export async function getGeolocation(): Promise<GeolocationData | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Geolocation API request failed');
    }
    const data = await response.json();
    return {
      country_code: data.country_code,
      country_name: data.country_name,
    };
  } catch (error) {
    console.error('Failed to get geolocation:', error);
    return null;
  }
}

export function getSuggestedLanguage(countryCode: string): 'en' | 'es' | 'fr' {
  // Spanish-speaking countries
  const spanishCountries = [
    'ES', // Spain
    'MX', // Mexico
    'AR', // Argentina
    'CO', // Colombia
    'PE', // Peru
    'VE', // Venezuela
    'CL', // Chile
    'EC', // Ecuador
    'GT', // Guatemala
    'CU', // Cuba
    'BO', // Bolivia
    'DO', // Dominican Republic
    'HN', // Honduras
    'PY', // Paraguay
    'SV', // El Salvador
    'NI', // Nicaragua
    'CR', // Costa Rica
    'PA', // Panama
    'UY', // Uruguay
    'GQ', // Equatorial Guinea
  ];

  // French-speaking countries
  const frenchCountries = [
    'FR', // France
    'CA', // Canada
    'BE', // Belgium
    'CH', // Switzerland
    'LU', // Luxembourg
    'MC', // Monaco
    'SN', // Senegal
    'CI', // Ivory Coast
    'ML', // Mali
    'BF', // Burkina Faso
    'NE', // Niger
    'TG', // Togo
    'BJ', // Benin
    'GA', // Gabon
    'CM', // Cameroon
    'TD', // Chad
    'CF', // Central African Republic
    'CG', // Congo
    'CD', // Democratic Republic of the Congo
    'RW', // Rwanda
    'BI', // Burundi
    'DJ', // Djibouti
    'KM', // Comoros
    'SC', // Seychelles
    'MU', // Mauritius
    'HT', // Haiti
    'GP', // Guadeloupe
    'MQ', // Martinique
    'GF', // French Guiana
    'RE', // Reunion
    'PM', // Saint Pierre and Miquelon
    'WF', // Wallis and Futuna
    'PF', // French Polynesia
    'NC', // New Caledonia
    'VU', // Vanuatu
    'FJ', // Fiji (has French as official)
  ];

  if (spanishCountries.includes(countryCode)) {
    return 'es';
  }

  if (frenchCountries.includes(countryCode)) {
    return 'fr';
  }

  return 'en';
}