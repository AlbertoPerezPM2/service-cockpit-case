"""Evidence/provenance checks, independent of the case-study JSX."""
import json
import re
import unittest
from prepare_case_study_evidence import DESTINATION, ROOT, prepare, read_rows


class CaseStudyEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.data = prepare()

    def test_saved_presentation_matches_sources(self):
        self.assertEqual(json.loads(DESTINATION.read_text()), self.data)

    def test_identity_reconciliation_and_exclusions(self):
        self.assertEqual(self.data['reconciliation'], {
            'sourceInstallationRows': 415, 'resolvableInstallationRows': 412,
            'canonicalInstalledUnits': 400, 'duplicateSourceRows': 12,
            'unresolvedInstallationRows': 3, 'canonicalTelemetryReferences': 273,
            'telemetryOnlyReferences': [f'TH-9000{i}' for i in range(5)],
            'matchedTelemetryUnits': 268, 'installedUnitsWithoutTelemetry': 132,
        })
        # Audit the claim that every nonblank reference is resolvable against the
        # saved fleet, using ONLY the formats already documented in 01_eda.ipynb.
        # This check never exports identities or changes the canonical dataset.
        fleet = {r['unit_id'] for r in read_rows('outputs/units_clean.csv')}
        resolved = []
        for row in read_rows('data/installation_base.csv'):
            ref = row['reference_number'].strip().upper()
            if not ref:
                continue
            match = re.fullmatch(r'(?:TH[\s_-]?)?(\d{5})(?:-1)?', ref)
            self.assertIsNotNone(match, ref)
            canonical = 'TH-' + match.group(1)
            self.assertIn(canonical, fleet)
            resolved.append(canonical)
        self.assertEqual(len(resolved), 412)
        self.assertEqual(set(resolved), fleet)

    def test_exact_cohorts_and_dated_evidence(self):
        cohorts = self.data['cohorts']
        technical = cohorts['technician_review']
        self.assertEqual([r['unitId'] for r in technical], ['TH-02298', 'TH-02312', 'TH-02395', 'TH-02398'])
        for row in technical:
            self.assertEqual(row['oem'], 'C')
            signal = row['signals'][0]
            self.assertEqual((signal['rawSignal'], signal['persistenceDays'], signal['firstObserved'], signal['lastObserved']),
                             ('ALM_HP_LOWFLOW', 14, '2026-07-17', '2026-07-30'))
        connectivity = cohorts['data_connectivity_review']
        self.assertEqual([r['unitId'] for r in connectivity], ['TH-02023', 'TH-02280', 'TH-02304'])
        self.assertEqual({r['oem'] for r in connectivity}, {'A', 'B', 'C'})
        for row in connectivity:
            self.assertTrue(row['hasTelemetry'])
            self.assertEqual((row['latestReading'], row['daysStale']), ('2026-07-20', 10))
        self.assertEqual(self.data['snapshotDate'], '2026-07-30')

    def test_frequency_table_matches_saved_analysis(self):
        expected = [('B', '6021', 2475, 98), ('A', 'E-211', 143, 46), ('B', '3104', 116, 47),
                    ('B', '7702', 61, 50), ('A', 'E-317', 56, 46), ('C', 'ALM_HP_LOWFLOW', 56, 4),
                    ('C', 'ALM_SM_LINK', 53, 39), ('A', 'E-104', 51, 38), ('A', 'E-505', 47, 33),
                    ('B', '1188', 45, 39), ('C', 'ALM_HP_HP_SWITCH', 44, 33)]
        actual = [(r['oem'], r['rawSignal'], r['observations'], r['reportingUnitsWithSignal']) for r in self.data['signalFrequency']]
        self.assertCountEqual(actual, expected)

    def test_methodology_labels_are_backed_by_saved_notebook_predicates(self):
        notebook = json.loads((ROOT / 'notebooks/02_attention_logic.ipynb').read_text())
        code = '\n'.join(''.join(c['source']) for c in notebook['cells'] if c['cell_type'] == 'code')
        for predicate in ['["days_with_code"] >= 2', '["affected_unit_pct"] < 20', '["days_since_last_error"] <= 7', '["days_since_last_reading"] >= 2']:
            self.assertIn(predicate, code)
        self.assertEqual(self.data['methodology']['label'], 'Prototype heuristic used for this dataset')
