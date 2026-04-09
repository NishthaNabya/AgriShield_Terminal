export const missionTelemetryResponse = {
  missionId: "W-3847",
  status: "active",
  observations: [
    {
      id: "obs_001",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659200,
      updated_at: 1712659201,
      latitude: 0.5143,
      longitude: 36.0726,
      altitude: 18240,
      temperature: -58.2,
      pressure: 72.4,
      humidity: 0.1,
      specific_humidity: 3.8,
      speed_u: 14.2,
      speed_v: -3.8,
      dewpoint_2m: -65.1 // Forecast field kept for Saturation gauge
    },
    {
      id: "obs_002",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659210,
      updated_at: 1712659212,
      latitude: 0.5144,
      longitude: 36.0727,
      altitude: 17800,
      temperature: -52.4,
      pressure: 80.1,
      humidity: 0.1,
      specific_humidity: 4.2,
      speed_u: 13.5,
      speed_v: -4.1,
      dewpoint_2m: -57.0
    },
    {
      id: "obs_003",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659220,
      updated_at: 1712659223,
      latitude: 0.5145,
      longitude: 36.0728,
      altitude: 17350,
      temperature: -47.1,
      pressure: 88.5,
      humidity: 0.1,
      specific_humidity: 5.1,
      speed_u: 12.8,
      speed_v: -4.5,
      dewpoint_2m: -50.2
    },
    {
      id: "obs_004",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659230,
      updated_at: 1712659232,
      latitude: 0.5146,
      longitude: 36.0729,
      altitude: 16800,
      temperature: -41.5,
      pressure: 99.2,
      humidity: 0.2,
      specific_humidity: 6.8,
      speed_u: 11.2,
      speed_v: -5.0,
      dewpoint_2m: -43.1
    },
    {
      id: "obs_005",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659240,
      updated_at: 1712659245,
      latitude: 0.5147,
      longitude: 36.0730,
      altitude: 16210,
      temperature: -35.2,
      pressure: 111.4,
      humidity: 0.2,
      specific_humidity: 7.5,
      speed_u: 9.5,
      speed_v: -5.3,
      dewpoint_2m: -37.0
    },
    {
      id: "obs_006",
      mission_id: "W-3847",
      mission_name: "GSB-S4 Equatorial",
      timestamp: 1712659250,
      updated_at: 1712659252,
      latitude: 0.5148,
      longitude: 36.0731,
      altitude: 15500,
      temperature: -28.1,
      pressure: 125.8,
      humidity: 0.4,
      specific_humidity: 8.9,
      speed_u: 7.1,
      speed_v: -5.8,
      dewpoint_2m: -29.2
    }
  ]
};

export const pointForecastData = {
  latitude: 0.5143,
  longitude: 36.0726,
  model: "wm-5c",
  initializationTime: "2026-04-08T06:40:00Z",
  ecmwf_precipitation_mm_hr: 2.1,
  forecasts: [
    [
      {
        validTime: "2026-04-08T07:00:00Z",
        peak_precipitation_mm_hr: 18.9,
        ensembleSpreadDerived: {
          mean_precipitation: 15.2,
          spread_std_dev: 4.8,
          range_min: 10.0,
          range_max: 22.0,
          iqr_low: 13.1,
          iqr_high: 18.4
        },
        ensemble_members: [
          18.2, 16.4, 19.1, 14.8, 12.3, 17.5, 20.1, 15.9,
          11.8, 18.7, 16.2, 19.8, 13.5, 17.1, 21.3, 15.2,
          14.1, 18.9, 16.8, 20.5, 10.2, 17.8, 19.4, 8.7
        ]
      }
    ]
  ],
  convergenceTrend: [
    { hour: -6, gap: 8.1 },
    { hour: -5, gap: 7.2 },
    { hour: -4, gap: 5.8 },
    { hour: -3, gap: 4.1 },
    { hour: -2, gap: 2.9 },
    { hour: -1, gap: 1.6 }
  ]
};
