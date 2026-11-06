"""Convert AwareDX supplementary spreadsheets (Chandak & Tatonetti 2020) to CSV.

Stdlib only. Usage:
  python3 -I scripts/xlsx_to_csv.py <mmc2.xlsx> <mmc4.xlsx> <out_dir>
"""
import csv, os, re, sys, zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def col_index(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_sheets(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    files = sorted(
        (f for f in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", f)),
        key=lambda f: int(re.findall(r"\d+", f)[-1]),
    )
    for f in files:
        rows = []
        for _, el in ET.iterparse(z.open(f)):
            if el.tag == NS + "row":
                row = {}
                for c in el.findall(NS + "c"):
                    v = c.find(NS + "v")
                    t = c.get("t")
                    if t == "s" and v is not None:
                        val = shared[int(v.text)]
                    elif t == "inlineStr":
                        val = "".join(x.text or "" for x in c.iter(NS + "t"))
                    else:
                        val = v.text if v is not None else ""
                    row[col_index(c.get("r"))] = val.strip()
                width = max(row) + 1 if row else 0
                rows.append([row.get(i, "") for i in range(width)])
                el.clear()
        yield rows


def convert_mmc2(path, out):
    rows = next(read_sheets(path))
    header = ["drug", "atc_level", "drug_concept_id", "adverse_event", "meddra_level",
              "adr_concept_id", "log_ror", "ci_low", "ci_high", "p_min", "p_median", "p_max", "risk_sex"]
    n = 0
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        for r in rows[1:]:
            if len(r) < 12 or not r[0]:
                continue
            log_ror = float(r[6])
            # AwareDX convention: ROR = odds in women / odds in men -> positive log(ROR) = higher risk in women.
            w.writerow(r[:12] + ["F" if log_ror > 0 else "M"])
            n += 1
    return n


def convert_mmc4(path, out):
    header = ["drug", "gene", "gene_title", "variant", "clinical_annotation", "evidence_level",
              "adr", "expected_sex", "observed_sex", "log_ror"]
    n = 0
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        rows = next(read_sheets(path))  # Positive examples sheet
        gene = title = variant = ""
        for r in rows[2:]:
            r = r + [""] * (19 - len(r))
            gene = r[1] or gene
            title = r[2] or title
            variant = r[6] or variant
            if not r[13] or not r[14]:
                continue
            w.writerow([r[13], gene, title, variant, r[11], r[12], r[14], r[15], r[16], r[17]])
            n += 1
    return n


if __name__ == "__main__":
    mmc2, mmc4, out_dir = sys.argv[1:4]
    print("sex_biased_adrs rows:", convert_mmc2(mmc2, os.path.join(out_dir, "sex_biased_adrs.csv")))
    print("pgx_examples rows:", convert_mmc4(mmc4, os.path.join(out_dir, "pgx_examples.csv")))
