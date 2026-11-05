/**
 * Cleaner App 2.0 — demo data.
 *
 * Everything in this file is DEMONSTRATION data. Nothing here is a real
 * commercial price, real availability or real company information.
 * In a future phase these objects will be replaced by data loaded from
 * the backend (e.g. Supabase tables: services, extras, pricing_rules).
 */
(function (global) {
  'use strict';

  const CleanerApp = global.CleanerApp || (global.CleanerApp = {});

  /**
   * Property types. Which ones are offered depends on the service
   * (see SERVICES[].form.propertyTypes).
   */
  const PROPERTY_TYPES = {
    apartment: { id: 'apartment', name: 'Apartment', icon: 'apartment' },
    house: { id: 'house', name: 'House', icon: 'house' },
    office: { id: 'office', name: 'Office', icon: 'office' }
  };

  /** Optional add-on services. */
  const EXTRAS = {
    oven: { id: 'oven', name: 'Inside Oven', description: 'Degreasing of oven interior, racks and door.', icon: 'oven' },
    fridge: { id: 'fridge', name: 'Inside Fridge', description: 'Emptied shelves and drawers wiped and sanitised.', icon: 'fridge' },
    windows: { id: 'windows', name: 'Interior Windows', description: 'Inside glass, frames and sills.', icon: 'window' },
    cabinets: { id: 'cabinets', name: 'Inside Cabinets', description: 'Interior of empty kitchen cupboards.', icon: 'cabinet' },
    ironing: { id: 'ironing', name: 'Ironing', description: 'Ironing of clothes and linen during the visit.', icon: 'iron' }
  };

  /**
   * Services offered.
   * `form` describes which property fields each service asks for, so the
   * booking form can adapt per service without hard-coded conditions.
   *  - propertyTypes: allowed property types (a single one is auto-selected)
   *  - fields: numeric/size fields shown in step 2; omitted fields are hidden
   *  - extras: add-ons available for this service
   */
  const SERVICES = [
    {
      id: 'regular',
      name: 'Regular Cleaning',
      description: 'Routine weekly or fortnightly cleaning to keep your home fresh, tidy and comfortable.',
      image: 'assets/images/service-regular.jpg',
      icon: 'sparkles',
      form: {
        propertyTypes: ['apartment', 'house'],
        fields: {
          bedrooms: { label: 'Bedrooms', min: 0, max: 8, default: 1 },
          bathrooms: { label: 'Bathrooms', min: 1, max: 6, default: 1 },
          size: { label: 'Approximate size', unit: 'm²', min: 10, max: 1000, required: false }
        },
        extras: ['oven', 'fridge', 'windows', 'cabinets', 'ironing']
      }
    },
    {
      id: 'deep',
      name: 'Deep Cleaning',
      description: 'A thorough top-to-bottom clean, reaching the areas a routine clean usually skips.',
      image: 'assets/images/service-deep.jpg',
      icon: 'spray',
      form: {
        propertyTypes: ['apartment', 'house'],
        fields: {
          bedrooms: { label: 'Bedrooms', min: 0, max: 8, default: 1 },
          bathrooms: { label: 'Bathrooms', min: 1, max: 6, default: 1 },
          size: { label: 'Approximate size', unit: 'm²', min: 10, max: 1000, required: false }
        },
        extras: ['oven', 'fridge', 'windows', 'cabinets', 'ironing']
      }
    },
    {
      id: 'tenancy',
      name: 'End of Tenancy Cleaning',
      description: 'A detailed clean when moving in or out, helping leave the property ready for the next stage.',
      image: 'assets/images/service-tenancy.jpg',
      icon: 'key',
      form: {
        propertyTypes: ['apartment', 'house'],
        fields: {
          bedrooms: { label: 'Bedrooms', min: 0, max: 8, default: 1 },
          bathrooms: { label: 'Bathrooms', min: 1, max: 6, default: 1 },
          size: { label: 'Approximate size', unit: 'm²', min: 10, max: 1000, required: false }
        },
        extras: ['oven', 'fridge', 'windows', 'cabinets']
      }
    },
    {
      id: 'office',
      name: 'Office Cleaning',
      description: 'Clean, organised workspaces for small and medium offices, scheduled around your business.',
      image: 'assets/images/service-office.jpg',
      icon: 'office',
      form: {
        propertyTypes: ['office'],
        fields: {
          bathrooms: { label: 'Restrooms', min: 0, max: 10, default: 1 },
          size: { label: 'Office size', unit: 'm²', min: 10, max: 5000, required: true }
        },
        extras: ['fridge', 'windows', 'cabinets']
      }
    }
  ];

  /** Demo time slots — NOT real availability. */
  const DEMO_TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  /** Demo calendar rules (easy to adjust later). */
  const CALENDAR_CONFIG = {
    isDemo: true,
    maxMonthsAhead: 6, // latest bookable date = today + N months
    minDaysAhead: 1, // 1 = earliest bookable date is tomorrow
    weekStartsOn: 1 // 0 = Sunday, 1 = Monday
  };

  /**
   * Demo pricing rules, organised per service.
   * `model` selects a pricing strategy in booking.js (PRICING_MODELS):
   *  - rooms: basePrice + perBedroom * bedrooms + perBathroom * bathrooms
   *  - area:  basePrice + perSqm * (size above includedSqm) + perBathroom * restrooms
   * All values are FICTITIOUS and must not be used as commercial prices.
   */
  const PRICING_CONFIG = {
    isDemo: true,
    currency: 'EUR',
    locale: 'en-IE',
    services: {
      regular: { model: 'rooms', basePrice: 60, baseHours: 2, perBedroom: 15, perBedroomHours: 0.5, perBathroom: 12, perBathroomHours: 0.5 },
      deep: { model: 'rooms', basePrice: 110, baseHours: 3.5, perBedroom: 25, perBedroomHours: 1, perBathroom: 20, perBathroomHours: 0.75 },
      tenancy: { model: 'rooms', basePrice: 150, baseHours: 4, perBedroom: 30, perBedroomHours: 1, perBathroom: 25, perBathroomHours: 1 },
      office: { model: 'area', basePrice: 70, baseHours: 2, includedSqm: 50, perSqm: 0.6, sqmPerHour: 80, perBathroom: 10, perBathroomHours: 0.25 }
    },
    extras: {
      oven: { price: 25, hours: 0.75 },
      fridge: { price: 20, hours: 0.5 },
      windows: { price: 30, hours: 1 },
      cabinets: { price: 20, hours: 0.75 },
      ironing: { price: 25, hours: 1 }
    }
  };

  CleanerApp.data = {
    PROPERTY_TYPES,
    EXTRAS,
    SERVICES,
    DEMO_TIME_SLOTS,
    CALENDAR_CONFIG,
    PRICING_CONFIG,
    getService(id) {
      return SERVICES.find((service) => service.id === id) || null;
    }
  };
})(window);
