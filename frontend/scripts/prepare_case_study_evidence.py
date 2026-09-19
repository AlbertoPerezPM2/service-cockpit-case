"""Project saved evidence into a presentation-only snapshot; never select candidates.

Source-row totals are a read-only count of installation_base.csv. Identity decisions
remain in 01_eda.ipynb and its canonical exports. No source identifiers are remapped
here. Signal frequencies are copied from error_code_summary.csv, not recomputed.
Run directly to write src/data/case-study-evidence.json; tests check it for drift.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / 'frontend/src/data/case-study-evidence.json'


def read_rows(path):
    with (ROOT / path).open(encoding='utf-8', newline='') as handle:
        return list(csv.DictReader(handle))


def prepare():
    installation = read_rows('data/installation_base.csv')
    fleet = read_rows('outputs/units_clean.csv')
    telemetry = read_rows('outputs/telemetry_clean.csv')
    summary = read_rows('outputs/error_code_summary.csv')
    cockpit = json.loads((ROOT / 'frontend/public/data/cockpit.json').read_text())
    installed_ids = {row['unit_id'] for row in fleet}
    telemetry_ids = {row['unit_id'] for row in telemetry}
    missing = sum(not row['reference_number'].strip() for row in installation)
    resolvable_rows = len(installation) - missing
    units = {unit['unitId']: unit for unit in cockpit['units']}
    cohorts = {queue: [] for queue in ['technician_review', 'data_connectivity_review']}
    for item in cockpit['attentionItems']:
        unit = units[item['unitId']]
        cohorts[item['queue']].append({
            'unitId': unit['unitId'], 'oem': unit['oem'],
            'latestReading': unit['latestReading'], 'hasTelemetry': unit['hasTelemetry'],
            'daysStale': item['daysStale'], 'signals': item['signals'],
        })
    for cohort in cohorts.values():
        cohort.sort(key=lambda row: row['unitId'])
    return {
        'sources': ['data/installation_base.csv', 'outputs/units_clean.csv',
                    'outputs/telemetry_clean.csv', 'outputs/error_code_summary.csv',
                    'frontend/public/data/cockpit.json'],
        'reconciliation': {
            'sourceInstallationRows': len(installation),
            'resolvableInstallationRows': resolvable_rows,
            'canonicalInstalledUnits': len(installed_ids),
            'duplicateSourceRows': resolvable_rows - len(installed_ids),
            'unresolvedInstallationRows': missing,
            'canonicalTelemetryReferences': len(telemetry_ids),
            'telemetryOnlyReferences': sorted(telemetry_ids - installed_ids),
            'matchedTelemetryUnits': len(installed_ids & telemetry_ids),
            'installedUnitsWithoutTelemetry': len(installed_ids - telemetry_ids),
        },
        'snapshotDate': cockpit['meta']['snapshotDate'],
        'cohorts': cohorts,
        'signalFrequency': [
            {'oem': row['vendor_canonical'], 'rawSignal': row['error_code_raw'],
             'observations': int(row['readings']), 'reportingUnitsWithSignal': int(row['affected_units'])}
            for row in sorted(summary, key=lambda row: (-int(row['readings']), row['error_code_raw']))
        ],
        # Document existing notebook predicates only. These never drive cockpit logic.
        'methodology': {
            'source': 'notebooks/02_attention_logic.ipynb',
            'label': 'Prototype heuristic used for this dataset',
            'minimumReportingDays': 2, 'maximumOemPrevalenceExclusivePercent': 20,
            'recentWindowDaysInclusive': 7, 'staleDaysInclusive': 2,
        },
    }


if __name__ == '__main__':
    DESTINATION.write_text(json.dumps(prepare(), ensure_ascii=False, indent=2) + '\n')
    print('Prepared presentation-only evidence snapshot')
