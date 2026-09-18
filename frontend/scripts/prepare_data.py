"""Project prepared analysis outputs into static frontend data. Never read raw data.

Run: python3 frontend/scripts/prepare_data.py [--check]
--check validates both the source snapshot and the committed JSON without writing.
"""

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

FRONTEND = Path(__file__).resolve().parents[1]
SOURCE = FRONTEND.parent / "outputs"
DESTINATION = FRONTEND / "public/data/cockpit.json"
SOURCE_FILES = (
    "units_clean.csv", "attention_list.csv", "unit_error_recurrence.csv",
    "telemetry_clean.csv",
)
FIELDS = {
    "outdoor_temp_c": ("Outdoor temperature", "°C"),
    "flow_temp_c": ("Flow temperature", "°C"),
    "return_temp_c": ("Return temperature", "°C"),
    "dhw_actual_c": ("DHW temperature", "°C"),
    "electrical_energy_kwh": ("Electrical energy", "raw OEM value"),
    "thermal_energy_kwh": ("Thermal energy", "raw OEM value"),
    "compressor_starts": ("Compressor starts", ""),
    "defrost_cycles": ("Defrost cycles", ""),
    "status_raw": ("Status", "raw OEM value"),
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(value):
    return float(value) if value != "" else None


def boolean(value):
    require(value in ("True", "False"), f"Unexpected boolean: {value!r}")
    return value == "True"


def iso_date(value):
    if not value:
        return None
    for pattern in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(value, pattern).date().isoformat()
        except ValueError:
            pass
    raise ValueError(f"Unrecognized date: {value!r}")


def service_context_flags(commissioning_date, last_service_visit):
    """Observe ordering of supplied ISO dates without changing either value."""
    if commissioning_date and last_service_visit and last_service_visit < commissioning_date:
        return ["service_date_conflict"]
    return []


def measurement(row, field):
    raw = row[field] or None
    if raw is not None and field != "status_raw":
        raw = float(raw)
    # Presentation exclusion only. The source is retained, not confirmed invalid.
    suspected = field.endswith("_c") and raw == -999
    return {
        "rawValue": raw,
        "value": None if suspected else raw,
        "suspectedSentinel": suspected,
    }


def prepare():
    sources = {}
    for name in SOURCE_FILES:
        with (SOURCE / name).open(newline="", encoding="utf-8") as handle:
            sources[name] = list(csv.DictReader(handle))
    fleet = sources["units_clean.csv"]
    attention_source = sources["attention_list.csv"]
    telemetry = sources["telemetry_clean.csv"]
    ids = {row["unit_id"] for row in fleet}
    require(len(ids) == len(fleet), "Duplicate unit IDs in prepared fleet")
    require(all(ids), "Missing canonical unit ID")
    snapshot = max(row["reading_date"] for row in telemetry)
    start = min(row["reading_date"] for row in telemetry)
    recent_start = (date.fromisoformat(snapshot) - timedelta(days=29)).isoformat()

    by_unit = defaultdict(list)
    by_oem = defaultdict(list)
    excluded = []
    for row in telemetry:
        if row["unit_id"] not in ids:
            excluded.append(row)
            continue
        by_unit[row["unit_id"]].append(row)
        by_oem[row["vendor_canonical"]].append(row)
    for rows in by_unit.values():
        rows.sort(key=lambda row: row["reading_date"])
        require(len(rows) == len({row["reading_date"] for row in rows}),
                "Multiple telemetry readings for one unit/date")

    # Observed availability in this extract, not a formal capability contract.
    oem_fields = {}
    for oem, rows in sorted(by_oem.items()):
        oem_fields[oem] = {}
        for field, (label, unit) in FIELDS.items():
            present = sum(row[field] != "" for row in rows)
            availability = ("unsupported" if present == 0 else
                            "intermittent" if present < len(rows) else "observed")
            oem_fields[oem][field] = {
                "label": label, "unit": unit, "availability": availability,
            }

    recurrence = {
        (row["vendor_canonical"], row["unit_id"], row["error_code_raw"]): row
        for row in sources["unit_error_recurrence.csv"]
    }
    attention = []
    stale_ids = set()
    require(len({row["unit_id"] for row in attention_source}) == len(attention_source),
            "Duplicate attention units")
    for row in attention_source:
        require(row["unit_id"] in ids, "Attention item outside resolved fleet")
        stale = boolean(row["signal_stale_telemetry"])
        recurrent = boolean(row["signal_recurrent_error"])
        if stale:
            stale_ids.add(row["unit_id"])
        signals = []
        if recurrent:
            # Attach evidence only to signals already selected by the notebook.
            for code in row["raw_error_signal"].split(", "):
                key = (row["vendor_canonical"], row["unit_id"], code)
                require(key in recurrence, f"Missing recurrence evidence: {key}")
                evidence = recurrence[key]
                signals.append({
                    "type": "persistent_oem_signal",
                    "label": "Persistent OEM signal", "rawSignal": code,
                    "persistenceDays": int(evidence["days_with_code"]),
                    "firstObserved": evidence["first_seen"],
                    "lastObserved": evidence["last_seen"],
                })
            require(max(s["persistenceDays"] for s in signals)
                    == number(row["recurrent_error_days"]), "Recurrence mismatch")
        if stale:
            signals.append({
                "type": "telemetry_stopped", "label": "Telemetry stopped",
                "lastReading": row["latest_reading"],
                "daysStale": int(float(row["days_since_last_reading"])),
            })
        require(signals, "Attention row without prepared signals")
        require(row["review_queue"] in ("technician_review", "data_connectivity_review"),
                "Unknown prepared queue")
        attention.append({
            "unitId": row["unit_id"], "queue": row["review_queue"],
            "signals": signals, "sourceReason": row["attention_reasons"],
            "persistenceDays": number(row["recurrent_error_days"]),
            "lastObserved": iso_date(row["latest_error"]),
            "daysStale": number(row["days_since_last_reading"]),
        })

    units = []
    for row in sorted(fleet, key=lambda row: row["unit_id"]):
        uid = row["unit_id"]
        rows = by_unit[uid]
        has_telemetry = boolean(row["has_telemetry"])
        require(has_telemetry == bool(rows), f"Telemetry presence mismatch: {uid}")
        latest = rows[-1] if rows else None
        require(all(r["vendor_canonical"] == row["vendor_canonical"] for r in rows),
                f"Telemetry OEM mismatch: {uid}")
        require((latest["reading_date"] if latest else None) == iso_date(row["latest_reading"]),
                f"Latest reading mismatch: {uid}")
        state = "no_telemetry" if not has_telemetry else "stale" if uid in stale_ids else "current"
        # Validate the prepared classification against the existing notebook window.
        # This never selects or routes an attention candidate.
        age = number(row["days_since_last_reading"])
        if has_telemetry:
            require(age == (date.fromisoformat(snapshot) - date.fromisoformat(row["latest_reading"])).days,
                    f"Prepared age mismatch: {uid}")
            require((age >= 2) == (uid in stale_ids), f"Prepared freshness mismatch: {uid}")
        latest_fields = {}
        for field in FIELDS:
            value = measurement(latest, field) if latest else {
                "rawValue": None, "value": None, "suspectedSentinel": False,
            }
            oem_availability = oem_fields[row["vendor_canonical"]][field]["availability"]
            value["availability"] = (
                "unsupported" if oem_availability == "unsupported" else
                "missing_for_unit" if not any(r[field] != "" for r in rows) else
                "suspected_sentinel" if value["suspectedSentinel"] else
                "missing_reading" if value["rawValue"] is None else "available"
            )
            latest_fields[field] = value
        recent = []
        for reading in rows:
            if reading["reading_date"] < recent_start:
                continue
            recent.append({
                "date": reading["reading_date"],
                "rawSignal": reading["error_code_raw"] or None,
                "values": {field: measurement(reading, field)["value"] for field in FIELDS},
                "suspectedSentinels": {
                    field: -999 for field in FIELDS
                    if measurement(reading, field)["suspectedSentinel"]
                },
            })
        commissioning_date = iso_date(row["commissioning_date"])
        last_service_visit = iso_date(row["last_service_visit"])
        quality_flags = ["source_conflict"] if boolean(row["connectivity_conflict"]) else []
        quality_flags.extend(service_context_flags(commissioning_date, last_service_visit))
        units.append({
            "unitId": uid, "customerName": row["customer_name"],
            "oem": row["vendor_canonical"], "region": row["postcode_region"],
            "serviceTier": row["service_tier"],
            "commissioningDate": commissioning_date,
            "lastServiceVisit": last_service_visit,
            "connectivity": row["connectivity"],
            "dataQualityFlags": quality_flags,
            "dataState": state, "hasTelemetry": has_telemetry,
            "firstReading": iso_date(row["first_reading"]),
            "latestReading": iso_date(row["latest_reading"]),
            "daysSinceLastReading": age,
            "reportingDays": int(float(row["telemetry_days"])) if row["telemetry_days"] else 0,
            "coveragePercent": number(row["telemetry_coverage_pct"]),
            "latestMeasurements": latest_fields, "recentReadings": recent,
        })

    for item in attention_source:
        unit_row = next(row for row in fleet if row["unit_id"] == item["unit_id"])
        for field in ("vendor_canonical", "customer_name", "postcode_region", "service_tier",
                      "latest_reading", "days_since_last_reading"):
            require(item[field] == unit_row[field], f"Attention/fleet mismatch: {field}")

    data = {
        "schemaVersion": 1,
        "meta": {
            "snapshotDate": snapshot, "periodStart": start,
            "periodDays": (date.fromisoformat(snapshot) - date.fromisoformat(start)).days + 1,
            "recentPeriodStart": recent_start, "freshnessWindowDays": 2,
            "availabilityBasis": "supplied_data",
            "sources": {name: hashlib.sha256((SOURCE / name).read_bytes()).hexdigest()
                        for name in SOURCE_FILES},
            "excludedTelemetry": {"rows": len(excluded),
                                  "unitIds": sorted({r["unit_id"] for r in excluded})},
        },
        "oemFields": oem_fields, "units": units, "attentionItems": attention,
    }
    validate_snapshot(data)
    return data


def validate_snapshot(data):
    """Snapshot expectations are checks only; the UI computes counts from arrays."""
    units, attention = data["units"], data["attentionItems"]
    require(len(units) == 400, "Expected 400 resolved units")
    require(Counter(u["oem"] for u in units) == {"A": 140, "B": 150, "C": 110},
            "Unexpected OEM fleet counts")
    require(sum(u["hasTelemetry"] for u in units) == 268, "Expected 268 reporting units")
    require(len(attention) == 7, "Expected 7 attention items")
    expected = {
        "technician_review": {"TH-02298", "TH-02312", "TH-02395", "TH-02398"},
        "data_connectivity_review": {"TH-02023", "TH-02280", "TH-02304"},
    }
    for queue, ids in expected.items():
        require({a["unitId"] for a in attention if a["queue"] == queue} == ids,
                f"Changed prepared cohort: {queue}")
    require(data["meta"]["snapshotDate"] == "2026-07-30", "Unexpected snapshot date")
    require(all(-999 not in r["values"].values() for u in units for r in u["recentReadings"]),
            "Suspected sentinel leaked into chart values")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    prepared = prepare()
    serialized = json.dumps(prepared, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    if args.check:
        require(DESTINATION.is_file(), "Missing frontend JSON; run prepare:data")
        require(DESTINATION.read_text(encoding="utf-8") == serialized,
                "Frontend JSON differs from prepared outputs; run prepare:data")
        print("PASS: committed JSON matches prepared sources and all snapshot checks.")
    else:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        DESTINATION.write_text(serialized, encoding="utf-8")
        print(f"Prepared {DESTINATION.relative_to(FRONTEND)}")
    print(f"Fleet: {len(prepared['units'])}; OEM counts: {dict(Counter(u['oem'] for u in prepared['units']))}")
    print(f"With telemetry: {sum(u['hasTelemetry'] for u in prepared['units'])}")
    print(f"Attention: {len(prepared['attentionItems'])}; queues: {dict(Counter(a['queue'] for a in prepared['attentionItems']))}")
