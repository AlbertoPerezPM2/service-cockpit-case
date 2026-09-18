"""Data contract checks for the supplied snapshot and conservative presentation."""

import unittest
from collections import Counter

from prepare_data import iso_date, measurement, prepare, service_context_flags


class PreparedDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = prepare()
        cls.units = {unit["unitId"]: unit for unit in cls.data["units"]}

    def test_snapshot_and_freshness(self):
        self.assertEqual(Counter(u["dataState"] for u in self.units.values()),
                         {"current": 265, "stale": 3, "no_telemetry": 132})
        one_day_old = [u for u in self.units.values() if u["daysSinceLastReading"] == 1]
        self.assertEqual(len(one_day_old), 6)
        self.assertTrue(all(u["dataState"] == "current" and u["latestReading"] == "2026-07-29"
                            for u in one_day_old))
        self.assertEqual(self.data["meta"]["excludedTelemetry"], {
            "rows": 135, "unitIds": [f"TH-9000{i}" for i in range(5)],
        })

    def test_sentinel_is_preserved_but_never_plotted(self):
        value = measurement({"flow_temp_c": "-999.0"}, "flow_temp_c")
        self.assertEqual(value, {"rawValue": -999.0, "value": None, "suspectedSentinel": True})
        flagged = 0
        for unit in self.units.values():
            self.assertNotIn("invalid_reading", unit["dataQualityFlags"])
            for reading in unit["recentReadings"]:
                for field, raw in reading["suspectedSentinels"].items():
                    flagged += 1
                    self.assertEqual(raw, -999)
                    self.assertIsNone(reading["values"][field])
        self.assertGreater(flagged, 0)

    def test_suspicions_do_not_become_confirmed_invalid_values(self):
        for field, raw in [("dhw_actual_c", "0"), ("electrical_energy_kwh", "-3.9")]:
            value = measurement({field: raw}, field)
            self.assertEqual(value["value"], float(raw))
            self.assertFalse(value["suspectedSentinel"])

    def test_availability_is_not_one_missing_bucket(self):
        fields = self.data["oemFields"]
        self.assertEqual(fields["C"]["return_temp_c"]["availability"], "unsupported")
        self.assertEqual(fields["C"]["dhw_actual_c"]["availability"], "intermittent")
        self.assertEqual(fields["A"]["outdoor_temp_c"]["availability"], "observed")
        missing = [u for u in self.units.values()
                   if u["oem"] == "C" and u["hasTelemetry"]
                   and u["latestMeasurements"]["dhw_actual_c"]["availability"] == "missing_for_unit"]
        self.assertGreater(len(missing), 0)
        self.assertTrue(all(u["latestMeasurements"]["return_temp_c"]["availability"] == "unsupported"
                            for u in self.units.values() if u["oem"] == "C"))

    def test_exported_connectivity_conflicts_remain_separate(self):
        self.assertEqual({u["unitId"] for u in self.units.values()
                          if "source_conflict" in u["dataQualityFlags"]},
                         {"TH-02060", "TH-02119", "TH-02199"})

    def test_service_date_conflict_preserves_supplied_dates(self):
        unit = self.units["TH-02312"]
        self.assertEqual(unit["commissioningDate"], "2024-08-03")
        self.assertEqual(unit["lastServiceVisit"], "2024-07-09")
        self.assertIn("service_date_conflict", unit["dataQualityFlags"])
        for unit in self.units.values():
            expected = bool(unit["lastServiceVisit"] and unit["commissioningDate"]
                            and unit["lastServiceVisit"] < unit["commissioningDate"])
            self.assertEqual("service_date_conflict" in unit["dataQualityFlags"], expected)

    def test_service_date_validation_is_strict_and_requires_both_dates(self):
        self.assertEqual(service_context_flags("2024-08-03", "2024-07-09"), ["service_date_conflict"])
        self.assertEqual(service_context_flags("2024-08-03", "2024-08-03"), [])
        self.assertEqual(service_context_flags("2024-08-03", "2024-08-04"), [])
        self.assertEqual(service_context_flags("2024-08-03", None), [])
        self.assertEqual(service_context_flags(None, "2024-07-09"), [])
        self.assertEqual(service_context_flags(None, None), [])

    def test_dates_are_unambiguous_and_missing_dates_stay_missing(self):
        self.assertEqual(iso_date("31.01.2026"), "2026-01-31")
        self.assertEqual(iso_date("2026-01-04"), "2026-01-04")
        self.assertIsNone(iso_date(""))
        with self.assertRaises(ValueError):
            iso_date("not a date")


if __name__ == "__main__":
    unittest.main()
