import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExclusions, parseAgeYears } from "./exclusions.ts";

const flags = (x: ReturnType<typeof parseExclusions>) => x.map((e) => e.flag).sort();

test("pregnancy, breastfeeding, contraception and BMI", () => {
  const criteria = `Inclusion Criteria:
* Age 18-55
* BMI between 18 and 30 kg/m2
* Women of childbearing potential must agree to use two methods of contraception

Exclusion Criteria:
* Pregnant or breastfeeding women
* Use of oral contraceptives within 30 days
* Severe hepatic impairment`;
  assert.deepEqual(flags(parseExclusions({ criteria, sex: "ALL", maximumAge: "55 Years" })), [
    "bmi_limit", "breastfeeding_excluded", "contraception_required", "hormonal_contraception_excluded",
    "kidney_liver_excluded", "older_adults_excluded", "pregnant_excluded",
  ].sort());
});

test("men-only trial and postmenopausal-only", () => {
  assert.deepEqual(flags(parseExclusions({ sex: "MALE" })), ["women_not_eligible"]);
  const c = "Inclusion Criteria:\n1. Postmenopausal women aged 50-75\n\nExclusion Criteria:\n1. Current hormone replacement therapy";
  assert.deepEqual(flags(parseExclusions({ criteria: c, sex: "FEMALE" })), ["hormone_therapy_excluded", "postmenopausal_only"]);
});

test("childbearing potential excluded outright vs. with contraception", () => {
  const a = "Exclusion Criteria:\n- Women of childbearing potential";
  assert.ok(flags(parseExclusions({ criteria: a })).includes("childbearing_potential_excluded"));
  const b = "Exclusion Criteria:\n- Women of childbearing potential not using adequate contraception";
  assert.ok(!flags(parseExclusions({ criteria: b })).includes("childbearing_potential_excluded"));
});

test("age parsing", () => {
  assert.equal(parseAgeYears("65 Years"), 65);
  assert.equal(parseAgeYears("6 Months"), 0.5);
  assert.equal(parseAgeYears(null), null);
});

test("health-condition and smoking exclusions", () => {
  const c = `Inclusion Criteria:
- Adults with insomnia

Exclusion Criteria:
- History of myocardial infarction or heart failure
- Type 1 or type 2 diabetes mellitus
- History of seizures
- Current major depressive disorder or bipolar disorder
- Active malignancy within 5 years
- Current smokers (more than 10 cigarettes per day)`;
  assert.deepEqual(flags(parseExclusions({ criteria: c })), ["cancer_excluded", "diabetes_excluded", "heart_excluded", "mental_health_excluded", "seizure_excluded", "smoker_excluded"].sort());
  assert.deepEqual(flags(parseExclusions({ criteria: "Inclusion Criteria:\n- Non-smokers\n\nExclusion Criteria:\n- None" })), []);
});

test("respiratory depression is not a mental health exclusion", () => {
  assert.deepEqual(flags(parseExclusions({ criteria: "Exclusion Criteria:\n- Severe respiratory depression\n- Use of CNS depressants" })), []);
});
